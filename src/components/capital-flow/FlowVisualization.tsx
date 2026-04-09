
import React, { useEffect, useState, useMemo, useCallback, useRef, Profiler } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { ExtendedOrbitalNode } from '@/types/orbitalNodes';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { ParticleLegend } from './panel/ParticleLegend';
import { BorderLegend } from './panel/BorderLegend';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { useSmartMoneyFlows } from '@/hooks/useSmartMoneyFlows';
import { getCategoriesForSymbol } from '@/lib/marketData/categoryMapping';
import { mapAIRecommendationToSignal, getCategoryColor as getSignalCategoryColor, determineCryptoSignalCategory } from './constants/signalCategories';
import { useSolarCoreCommand } from '@/contexts/SolarCoreCommandContext';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
  showLines: boolean;
}

const FlowVisualizationComponent: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 60,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all',
  showLines
}) => {
  const {
    svgRef,
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization
  } = useVisualizationSetup(flowData, zoomLevel);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  
  const { cryptoDataMaps, isLoading: loadingCryptoData } = useCryptoData();
  
  const symbolsInView = useMemo(() => {
    if (!visualizationData?.nodes) return [];
    return visualizationData.nodes.map(node => node.id);
  }, [visualizationData?.nodes]);

  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();
  const { flows: smartMoneyFlows, flowDirections } = useSmartMoneyFlows(symbolsInView);

  // ZOOM: Apply via viewBox scaling — no DOM wrapping needed
  const adjustedZoomLevel = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return zoomLevel;
    return dimensions.width < 768 ? zoomLevel * 0.6 : zoomLevel * 1.2;
  }, [dimensions.width, dimensions.height, zoomLevel]);

  // Compute viewBox based on zoom: zooming in = smaller viewBox = magnified content
  const viewBox = useMemo(() => {
    const scale = 100 / Math.max(adjustedZoomLevel, 10);
    const vw = dimensions.width * scale;
    const vh = dimensions.height * scale;
    const vx = (dimensions.width - vw) / 2;
    const vy = (dimensions.height - vh) / 2;
    return `${vx} ${vy} ${vw} ${vh}`;
  }, [adjustedZoomLevel, dimensions]);

  useEffect(() => {
    if (symbolsInView.length > 0) {
      requestOnChainData(symbolsInView);
    }
  }, [symbolsInView, requestOnChainData]);
  
  useVisualizationData({
    flowData,
    cryptoDataMaps,
    priceActionSignals,
    aiInsights,
    svgRef,
    dimensions,
    zoomLevel: adjustedZoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory
  });

  const { command, clearCommand, setSelectedNodeId: setCommandNodeId } = useSolarCoreCommand();

  // React to Helius Oracle commands
  useEffect(() => {
    if (!command) return;

    console.log('[SolarCore] Applying command:', command);

    // Apply focus on a specific node
    if (command.focusNodeId) {
      setSelectedNodeId(command.focusNodeId);
    }

    // If action is 'reset', clear selection and clear command
    if (command.action === 'reset') {
      setSelectedNodeId(null);
      clearCommand();
    }
  }, [command, clearCommand]);

  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
      setCommandNodeId(nodeId);
    };
    document.addEventListener('node-click', handleNodeClick as EventListener);
    return () => {
      document.removeEventListener('node-click', handleNodeClick as EventListener);
    };
  }, [setCommandNodeId]);

  const getCategoryColor = useCallback((symbol: string) => {
    const aiInsight = aiInsights.get(symbol);
    if (aiInsight) {
      const signalCategory = mapAIRecommendationToSignal(aiInsight.recommendation);
      return getSignalCategoryColor(signalCategory);
    }
    const crypto = cryptoDataMaps.bySymbol.get(symbol);
    if (crypto) {
      const signalCategory = determineCryptoSignalCategory(crypto);
      return getSignalCategoryColor(signalCategory);
    }
    return getSignalCategoryColor('neutral');
  }, [aiInsights, cryptoDataMaps.bySymbol]);

  // Filter nodes by command symbols when Helius Oracle sends a reconstruct/filter command
  const commandFilteredNodes = useMemo(() => {
    if (!visualizationData?.nodes) return [];
    const base = visualizationData.nodes.map(node => ({
      ...node,
      categories: getCategoriesForSymbol(node.id),
    }));

    // If the Oracle sent specific symbols, highlight/filter them
    if (command?.selectedSymbols && command.selectedSymbols.length > 0) {
      const symbolSet = new Set(command.selectedSymbols.map(s => s.toUpperCase()));
      return base.map(node => ({
        ...node,
        _commandHighlighted: symbolSet.has(node.id.toUpperCase()),
      }));
    }

    return base;
  }, [visualizationData?.nodes, command?.selectedSymbols]);

  const enrichedNodes = commandFilteredNodes;

  const hasValidDimensions = dimensions.width > 100 && dimensions.height > 100;
  const hasVisualizationData = visualizationData?.nodes?.length > 0;
  const isDataReady = !loadingCryptoData && !loadingSignals && !loadingAI;
  
  if (!hasValidDimensions || !isDataReady) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI-powered visualization...</p>
        </div>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-slate-400 text-lg">🌌 No flow data available</p>
          <p className="text-slate-500 text-sm">Waiting for market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <svg 
          ref={svgRef} 
          className="w-full h-full" 
          style={{ display: 'block' }}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
        />
      {hasVisualizationData && svgRef.current && (
        <>
          <StarfieldBackground
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            showLines={showLines}
          />
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={4}
            baseRadius={Math.min(dimensions.width, dimensions.height) * 0.08}
            extendFullScreen={true}
            showLines={showLines}
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            nodes={enrichedNodes}
            selectedNodeId={selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true}
            getCategoryColor={getCategoryColor}
            showLines={showLines}
            activeCategory={activeCategory}
            smartMoneyFlows={smartMoneyFlows}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={enrichedNodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={selectedNodeId}
            zoomLevel={adjustedZoomLevel}
            aiInsights={aiInsights}
            smartMoneyScores={smartMoneyScores}
            activeCategory={activeCategory}
            links={visualizationData.links}
            flowDirections={flowDirections}
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={enrichedNodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00001}
            updateLinksInRealTime={true}
          />
        </>
      )}
      </div>
      
      <div className="absolute bottom-4 left-4 z-10">
        <ParticleLegend />
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <BorderLegend />
      </div>
    </div>
  );
};

// Strict memoization - only re-render on meaningful prop changes
export const FlowVisualization = React.memo(FlowVisualizationComponent, (prevProps, nextProps) => {
  return (
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.chartTimeframe === nextProps.chartTimeframe &&
    prevProps.activeCategory === nextProps.activeCategory &&
    prevProps.showLines === nextProps.showLines &&
    prevProps.flowData.length === nextProps.flowData.length &&
    prevProps.predictions?.length === nextProps.predictions?.length
  );
});
