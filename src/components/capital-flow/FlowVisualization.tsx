
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import PredictionOrbitalOverlay from '../ai/PredictionOrbitalOverlay';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { useCryptoData } from '@/hooks/useCryptoData';
import { usePriceActionSignals } from '@/hooks/usePriceActionSignals';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
  activeCategory?: string;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 40,
  predictions = [],
  chartTimeframe = '4h',
  activeCategory = 'all'
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
  
  // Fetch necessary data for tooltips and node enrichment
  const { data: cryptoData, isLoading: loadingCryptoData } = useCryptoData();
  const { signals: priceActionSignals, signalsLoading: loadingSignals } = usePriceActionSignals(['BTC', 'ETH']);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const adjustedZoomLevel = zoomLevel * 1.5;

  // Create crypto data map for quick lookup
  const cryptoDataMap = React.useMemo(() => {
    const map = new Map<string, CryptoData>();
    if (cryptoData) {
      cryptoData.forEach(crypto => {
        map.set(crypto.symbol, crypto);
      });
    }
    return map;
  }, [cryptoData]);
  
  // Initialize visualization data, now passing the required maps
  useVisualizationData({
    flowData,
    cryptoDataMap,
    priceActionSignals,
    svgRef,
    dimensions,
    zoomLevel: adjustedZoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory
  });

  // Listen for node click events to update selected node
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

  // Get color based on category from backend (assuming category is in CryptoData)
  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case "🚀 Alta": return "#00FF88";
      case "🏃 Fuga": return "#FF3366";
      case "🧱 Acum.": return "#FFCC00";
      case "🔁 Rev.": return "#00CCFF";
      case "⚠️ Alert": return "#FF9900";
      case "Neutro": default: return "#8A9196";
    }
  };

  // Show loading state if data isn't ready
  if (loadingCryptoData || loadingSignals) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
        <p className="text-gray-400">Loading visualization data...</p>
      </div>
    );
  }

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
        <p className="text-gray-400">No flow data available</p>
      </div>
    );
  }

  const renderVisualization = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full absolute top-0 left-0" />
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
            baseRadius={60 * (adjustedZoomLevel / 100)}
            extendFullScreen={false}
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true}
            getCategoryColor={(linkSourceId) => getCategoryColor(cryptoDataMap.get(linkSourceId)?.category)}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={selectedNodeId}
            zoomLevel={adjustedZoomLevel}
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00002}
            updateLinksInRealTime={true}
          />
          {predictions && predictions.length > 0 && (
            <PredictionOrbitalOverlay
              svg={d3.select(svgRef.current)}
              nodes={visualizationData.nodes}
              updateInterval={600000}
              predictions={predictions}
              chartTimeframe={chartTimeframe}
            />
          )}
        </>
      )}
    </div>
  );
};
