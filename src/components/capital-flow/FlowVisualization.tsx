
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3'; 
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import PredictionOrbitalOverlay from '../ai/PredictionOrbitalOverlay';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';

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

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel: zoomLevel * 1.15,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory
  });

  // Atualiza visualização ao clicar em uma cripto
  useEffect(() => {
    const handleNodeClick = (event: CustomEvent) => {
      const nodeId = event.detail.nodeId;
      setSelectedNodeId(prevId => prevId === nodeId ? null : nodeId);
      setVisualizationData(prev => ({
        ...prev,
        selectedNodeId: prev.selectedNodeId === nodeId ? null : nodeId
      }));
    };

    document.addEventListener('node-click', handleNodeClick as EventListener);
    return () => document.removeEventListener('node-click', handleNodeClick as EventListener);
  }, [setVisualizationData]);

  // Garante que links sejam renderizados ao carregar
  useEffect(() => {
    if (flowData && flowData.length > 0 && svgRef.current && dimensions.width > 0) {
      if (animationRef.current === null && visualizationData.nodes.length > 0) {
        setVisualizationData(prev => ({
          ...prev,
          lastUpdate: Date.now()
        }));
      }
    }
  }, [flowData, dimensions, visualizationData.nodes, animationRef]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "🚀 Alta": return "#00FF88";
      case "🏃 Fuga": return "#FF3366";
      case "🧱 Acum.": return "#FFCC00";
      case "🔁 Rev.": return "#00CCFF";
      case "⚠️ Alert": return "#FF9900";
      default: return "#8A9196";
    }
  };

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
        <p className="text-gray-400">No flow data available</p>
      </div>
    );
  }

  const renderVisualization = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />

      {renderVisualization && svgRef.current && (
        <>
          <OrbitLayersComponent
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={34.5 * (zoomLevel / 100) * 1.15}
            extendFullScreen
          />

          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
            predictions={predictions}
            animateWithOrbit
            getCategoryColor={getCategoryColor}
          />

          <NodeRendererComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes.map(node => ({
              ...node,
              glowColor: node.flowCategory === "🚀 Alta" ? "rgba(0,255,136,0.6)" :
                         node.flowCategory === "🏃 Fuga" ? "rgba(255,51,102,0.6)" : 
                         "rgba(0,187,255,0.3)"
            }))}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel * 1.25}
          />

          <OrbitalAnimationComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00012}
            updateLinksInRealTime
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
