
import React, { useEffect, useState } from 'react';
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

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
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
  
  const symbolsInView = React.useMemo(() => {
    if (!visualizationData || !visualizationData.nodes) return [];
    return visualizationData.nodes.map(node => node.id);
  }, [visualizationData]);

  const { cryptoDataMaps, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();

  useEffect(() => {
    if (symbolsInView.length > 0) {
      requestOnChainData(symbolsInView);
    }
  }, [symbolsInView, requestOnChainData]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const adjustedZoomLevel = dimensions.width < 768 ? zoomLevel * 0.6 : zoomLevel * 1.2;
  
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

  const getCategoryColor = (symbol: string) => {
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
  };

  const enrichedNodes = React.useMemo(() => {
    if (!visualizationData || !visualizationData.nodes) return [];
    const nodes = visualizationData.nodes.map(node => {
      const categories = getCategoriesForSymbol(node.id);
      return {
        ...node,
        categories,
      };
    });
    console.log('📊 FlowVisualization - enrichedNodes:', nodes.length, 'activeCategory:', activeCategory);
    console.log('📊 Sample node categories:', nodes.slice(0, 3).map(n => ({ id: n.id, categories: n.categories })));
    return nodes;
  }, [visualizationData, activeCategory]);

  if (loadingCryptoData || loadingSignals || loadingAI) {
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

  // Verificação de segurança antes de renderizar
  const renderVisualization = svgRef.current && 
                             dimensions.width > 0 && 
                             visualizationData && 
                             visualizationData.nodes && 
                             visualizationData.nodes.length > 0;

  return (
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
      {renderVisualization && svgRef.current && (
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
  );
};
