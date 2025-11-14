
import React, { useEffect, useState, useMemo, useCallback, Profiler } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { ExtendedOrbitalNode } from '@/types/orbitalNodes';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { getCategoriesForSymbol } from '@/lib/marketData/categoryMapping';
import { mapAIRecommendationToSignal, getCategoryColor as getSignalCategoryColor, determineCryptoSignalCategory } from './constants/signalCategories';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
  showLines: boolean;
}

// Performance profiler callback (disabled in production)
const onRenderCallback = (
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  // Profiling disabled - enable only when debugging performance
};

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
  
  // All hooks must be called in the same order every render
  const { cryptoDataMaps, isLoading: loadingCryptoData } = useCryptoData();
  
  // Memoize symbols to prevent unnecessary re-calculations
  const symbolsInView = useMemo(() => {
    if (!visualizationData?.nodes) return [];
    return visualizationData.nodes.map(node => node.id);
  }, [visualizationData?.nodes]);

  // These hooks must always be called, regardless of symbolsInView
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();

  // Memoize adjusted zoom level - only calculate when we have valid dimensions
  const adjustedZoomLevel = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) {
      return zoomLevel; // Return base zoom as fallback
    }
    return dimensions.width < 768 ? zoomLevel * 0.6 : zoomLevel * 1.2;
  }, [dimensions.width, dimensions.height, zoomLevel]);

  // Effect for on-chain data request
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

  // Node click handler effect
  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
    };
    document.addEventListener('node-click', handleNodeClick as EventListener);
    return () => {
      document.removeEventListener('node-click', handleNodeClick as EventListener);
    };
  }, []);

  // Memoize category color function
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

  // Memoize enriched nodes calculation
  const enrichedNodes = useMemo(() => {
    if (!visualizationData?.nodes) return [];
    
    return visualizationData.nodes.map(node => ({
      ...node,
      categories: getCategoriesForSymbol(node.id),
    }));
  }, [visualizationData?.nodes, activeCategory]);

  // All hooks MUST be called before any conditional returns
  // Wait for proper dimensions AND data before rendering
  const hasValidDimensions = dimensions.width > 100 && dimensions.height > 100;
  const hasVisualizationData = visualizationData?.nodes?.length > 0;
  const isDataReady = !loadingCryptoData && !loadingSignals && !loadingAI;
  
  // Show loading until everything is ready
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
    <Profiler id="FlowVisualization" onRender={onRenderCallback}>
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <svg 
          ref={svgRef} 
          className="w-full h-full" 
          style={{ display: 'block' }}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
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
            baseRadius={Math.min(dimensions.width, dimensions.height) * 0.12}
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
    </div>
    </Profiler>
  );
};

// Export memoized component with custom comparison
export const FlowVisualization = React.memo(FlowVisualizationComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.zoomLevel === nextProps.zoomLevel &&
    prevProps.chartTimeframe === nextProps.chartTimeframe &&
    prevProps.activeCategory === nextProps.activeCategory &&
    prevProps.showLines === nextProps.showLines &&
    prevProps.flowData.length === nextProps.flowData.length &&
    prevProps.predictions?.length === nextProps.predictions?.length
  );
});
