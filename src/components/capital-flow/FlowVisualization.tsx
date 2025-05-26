import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererExtended } from './LinkRendererExtended';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
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
  activeCategory = 'all',
}) => {
  const {
    svgRef,
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
  } = useVisualizationSetup(flowData, zoomLevel);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization,
    activeCategory,
  });

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

  if (!flowData.length || !svgRef.current) {
    return <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
      <p className="text-gray-400">No flow data available</p>
    </div>;
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />
      {visualizationData.nodes.length > 0 && (
        <>
          <StarfieldBackground svg={d3.select(svgRef.current)} width={dimensions.width} height={dimensions.height} />
          <OrbitLayersComponent
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={34.5 * (zoomLevel / 100)}
            extendFullScreen={true}
          />
          <LinkRendererExtended
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true}
            getCategoryColor={getCategoryColor}
          />
          <NodeRendererComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel}
          />
          <OrbitalAnimationComponent
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00012}
            updateLinksInRealTime={true}
          />
          <PredictionOrbitalOverlay
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            predictions={predictions}
          />
        </>
      )}
    </div>
  );
};
