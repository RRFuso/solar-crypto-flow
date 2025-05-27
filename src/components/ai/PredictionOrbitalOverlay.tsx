
import React from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererComponent } from './LinkRenderer';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { PredictionOrbitalOverlay } from './PredictionOrbitalOverlay';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';
import { Prediction } from '@/lib/aiModel';

interface FlowVisualizationProps {
  flowData: FlowData[];
  predictions?: Prediction[]; // <- novo
  zoomLevel?: number;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  predictions = [],
  zoomLevel = 70 
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
  
  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel,
    setVisualizationData,
    animationRef,
    createOrbitalVisualization
  });

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
          <StarfieldBackground 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
          />
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={30 * (zoomLevel / 100)}
            extendFullScreen={true}
          />
          <LinkRendererComponent 
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel}
          />
          <PredictionOrbitalOverlay
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            predictions={predictions}
            zoomLevel={zoomLevel}
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
          />
        </>
      )}
    </div>
  );
};
