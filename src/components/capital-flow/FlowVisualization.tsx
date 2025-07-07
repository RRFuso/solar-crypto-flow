
import React, { useEffect, useState, useRef } from 'react';
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
import { ThreeScene, ThreeSceneHandles } from './visualization/ThreeScene';
import { PredictionOrbitalOverlay } from '@/components/ai/PredictionOrbitalOverlay';

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
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization
  } = useVisualizationSetup(flowData, zoomLevel);

  const threeSceneRef = useRef<ThreeSceneHandles>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);
  
  const symbolsInView = React.useMemo(() => {
    if (!visualizationData || !visualizationData.nodes) return [];
    return visualizationData.nodes.map(node => node.id);
  }, [visualizationData]);

  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(symbolsInView);
  const { insights: aiInsights, isLoading: loadingAI } = useAdvancedAI(symbolsInView);
  const { smartMoneyScores, requestOnChainData } = useOnChainData();

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
        case "hold": return "#FFCC00";
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

  // Verificação de segurança antes de renderizar
  const renderVisualization = threeSceneRef.current && 
                             dimensions.width > 0 && 
                             visualizationData && 
                             visualizationData.nodes && 
                             visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <ThreeScene ref={threeSceneRef} width={dimensions.width} height={dimensions.height} />
        <svg 
          ref={svgOverlayRef} 
          className="w-full h-full absolute top-0 left-0" 
          style={{ display: 'block', pointerEvents: 'none' }}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        />
      {renderVisualization && threeSceneRef.current && svgOverlayRef.current && (
        <>
          <StarfieldBackground 
            svg={d3.select(svgOverlayRef.current)}
            width={dimensions.width}
            height={dimensions.height}
          />
          <OrbitLayersComponent 
            svg={d3.select(svgOverlayRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={4}
            baseRadius={Math.min(dimensions.width, dimensions.height) * 0.12}
            extendFullScreen={true}
          />
          <LinkRendererExtended
            svg={d3.select(svgOverlayRef.current)}
            links={visualizationData.links}
            nodes={visualizationData.nodes}
            selectedNodeId={selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true}
            getCategoryColor={getCategoryColor}
            showLines={showLines}
          />
          <NodeRendererComponent 
            scene={threeSceneRef.current.scene}
            camera={threeSceneRef.current.camera}
            canvas={threeSceneRef.current.canvas}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={selectedNodeId}
            zoomLevel={adjustedZoomLevel}
            aiInsights={aiInsights}
            smartMoneyScores={smartMoneyScores}
          />
          <OrbitalAnimationComponent
            scene={threeSceneRef.current.scene}
            camera={threeSceneRef.current.camera}
            renderer={threeSceneRef.current.renderer}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00001}
            updateLinksInRealTime={true}
          />
          <PredictionOrbitalOverlay
            svg={d3.select(svgOverlayRef.current)}
            nodes={visualizationData.nodes}
            predictions={predictions}
            chartTimeframe={chartTimeframe}
            aiInsights={aiInsights}
          />
        </>
      )}
      </div>
    </div>
  );
};
