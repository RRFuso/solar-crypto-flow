import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
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
import { useRealtimeTicker } from '@/hooks/useRealtimeTicker'; // Import the real-time hook

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

  // Setup all data hooks
  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();
  
  // Add the real-time data hook
  const binanceSymbols = React.useMemo(() => symbolsInView.map(s => `${s}USDT`), [symbolsInView]);
  const { tickers: realtimeTickers } = useRealtimeTicker(binanceSymbols);

  useEffect(() => {
    if (symbolsInView.length > 0) {
      requestOnChainData(symbolsInView);
    }
  }, [symbolsInView, requestOnChainData]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const adjustedZoomLevel = zoomLevel * 1.2;

  const cryptoDataMap = React.useMemo(() => {
    const map = new Map<string, CryptoData>();
    if (cryptoData) {
      cryptoData.forEach(crypto => {
        map.set(crypto.symbol, crypto);
      });
    }
    return map;
  }, [cryptoData]);
  
  useVisualizationData({
    flowData,
    cryptoDataMap,
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
      switch (aiInsight.recommendation) {
        case "strong_buy": return "#00FF88";
        case "buy": return "#66FF99";
        case "hold": return "#00B5D8"; // Updated color
        case "sell": return "#FF6666";
        case "strong_sell": return "#FF3366";
        default: return "#8A9196";
      }
    }

    const crypto = cryptoDataMap.get(symbol);
    const category = crypto?.category;
    switch (category) {
      case "🚀 Alta": return "#00FF88";
      case "🏃 Fuga": return "#FF3366";
      case "🧱 Acum.": return "#FFCC00";
      case "🔁 Rev.": return "#00CCFF";
      case "⚠️ Alert": return "#FF9900";
      case "Neutro": default: return "#8A9196";
    }
  };

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
          />
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={4}
            baseRadius={Math.min(dimensions.width, dimensions.height) * 0.12}
            extendFullScreen={true}
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            nodes={visualizationData.nodes}
            selectedNodeId={selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true}
            getCategoryColor={getCategoryColor}
            showLines={showLines}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={selectedNodeId}
            zoomLevel={adjustedZoomLevel}
            aiInsights={aiInsights}
            smartMoneyScores={smartMoneyScores}
            realtimeTickers={realtimeTickers} // Pass real-time data down
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
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