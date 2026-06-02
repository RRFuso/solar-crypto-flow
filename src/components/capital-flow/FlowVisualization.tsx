
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
import { usePerformanceLOD } from './visualization/usePerformanceLOD';

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
    createOrbitalVisualization,
    renderEpoch,
    setRenderEpoch
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

  const handleSvgCleared = useCallback(() => {
    setRenderEpoch(prev => prev + 1);
  }, [setRenderEpoch]);

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
    activeCategory,
    onSvgCleared: handleSvgCleared
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

  // Adaptive Level-of-Detail (FPS-driven quality)
  const lod = usePerformanceLOD();

  // Enrich nodes with category data + Oracle highlight state, capped by LOD
  const enrichedNodes = useMemo(() => {
    if (!visualizationData?.nodes) return [];

    const hasHighlight = highlightedSymbols && highlightedSymbols.size > 0;

    const enriched = visualizationData.nodes.map(node => ({
      ...node,
      categories: getCategoriesForSymbol(node.id),
      _commandHighlighted: hasHighlight
        ? highlightedSymbols!.has(node.id.toUpperCase())
        : false,
      _hasCommandFilter: hasHighlight,
    }));

    // Cull beyond LOD cap — keep highest-priority nodes (central + highlighted + top by marketCap)
    if (enriched.length <= lod.maxNodes) return enriched;
    const sorted = [...enriched].sort((a, b) => {
      const ap = (a.type === 'central' ? 1e18 : 0) + (a._commandHighlighted ? 1e15 : 0) + (a.marketCap || 0);
      const bp = (b.type === 'central' ? 1e18 : 0) + (b._commandHighlighted ? 1e15 : 0) + (b.marketCap || 0);
      return bp - ap;
    });
    return sorted.slice(0, lod.maxNodes);
  }, [visualizationData?.nodes, highlightedSymbols, lod.maxNodes]);

  const hasValidDimensions = dimensions.width > 100 && dimensions.height > 100;
  const hasVisualizationData = visualizationData?.nodes?.length > 0;
  if (!hasValidDimensions) {
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
          <React.Fragment key={renderEpoch}>
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
              orbitLayers={9}
              baseRadius={Math.min(dimensions.width, dimensions.height) * 0.06}
              extendFullScreen={true}
              showLines={showLines}
            />
            <LinkRendererExtended
              svg={d3.select(svgRef.current)}
              links={visualizationData.links}
              nodes={enrichedNodes}
              selectedNodeId={selectedNodeId}
              predictions={predictions}
              animateWithOrbit={lod.animateLinks}
              getCategoryColor={getCategoryColor}
              showLines={showLines}
              activeCategory={activeCategory}
              smartMoneyFlows={smartMoneyFlows}
              showParticles={lod.showParticles}
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
              maxLabels={lod.maxLabels}
            />
            <OrbitalAnimationComponent
              svg={d3.select(svgRef.current)}
              nodes={enrichedNodes}
              width={dimensions.width}
              height={dimensions.height}
              rotationSpeed={0.00001}
              updateLinksInRealTime={false}
              enabled={lod.animateLinks}
            />
          </React.Fragment>
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
