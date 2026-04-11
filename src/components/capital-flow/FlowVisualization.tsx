
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  /** Symbols that should be visually highlighted (from Oracle commands) */
  highlightedSymbols?: Set<string>;
}

const FlowVisualizationComponent: React.FC<FlowVisualizationProps> = ({
  flowData,
  zoomLevel = 60,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all',
  showLines,
  highlightedSymbols,
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

  const symbolsKey = useMemo(() => [...symbolsInView].sort().join(','), [symbolsInView]);

  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();
  const { flows: smartMoneyFlows, flowDirections } = useSmartMoneyFlows(symbolsInView);

  // Stable zoom computation
  const adjustedZoomLevel = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return zoomLevel;
    return dimensions.width < 768 ? zoomLevel * 0.6 : zoomLevel * 1.2;
  }, [dimensions.width, dimensions.height, zoomLevel]);

  const viewBox = useMemo(() => {
    const scale = 100 / Math.max(adjustedZoomLevel, 10);
    const vw = dimensions.width * scale;
    const vh = dimensions.height * scale;
    const vx = (dimensions.width - vw) / 2;
    const vy = (dimensions.height - vh) / 2;
    return `${vx} ${vy} ${vw} ${vh}`;
  }, [adjustedZoomLevel, dimensions]);

  // On-chain data — only re-request when symbol set changes
  useEffect(() => {
    if (symbolsInView.length > 0) {
      requestOnChainData(symbolsInView);
    }
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { setSelectedNodeId: setCommandNodeId } = useSolarCoreCommand();

  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
      setCommandNodeId(nodeId);
    };
    document.addEventListener('node-click', handleNodeClick as EventListener);
    return () => document.removeEventListener('node-click', handleNodeClick as EventListener);
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

  // Enrich nodes with category data + Oracle highlight state
  const enrichedNodes = useMemo(() => {
    if (!visualizationData?.nodes) return [];

    const hasHighlight = highlightedSymbols && highlightedSymbols.size > 0;

    return visualizationData.nodes.map(node => ({
      ...node,
      categories: getCategoriesForSymbol(node.id),
      _commandHighlighted: hasHighlight
        ? highlightedSymbols!.has(node.id.toUpperCase())
        : false,
      _hasCommandFilter: hasHighlight,
    }));
  }, [visualizationData?.nodes, highlightedSymbols]);

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
              orbitLayers={7}
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
              updateLinksInRealTime={false}
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

// Strict memoization
export const FlowVisualization = React.memo(FlowVisualizationComponent, (prev, next) => {
  return (
    prev.zoomLevel === next.zoomLevel &&
    prev.chartTimeframe === next.chartTimeframe &&
    prev.activeCategory === next.activeCategory &&
    prev.showLines === next.showLines &&
    prev.flowData.length === next.flowData.length &&
    prev.predictions?.length === next.predictions?.length &&
    prev.highlightedSymbols === next.highlightedSymbols
  );
});
