
import React from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererComponent } from './LinkRenderer';
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
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 40,
  predictions = [],
  chartTimeframe = '4h'
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
  
  // Initialize visualization data
  useVisualizationData({
    flowData,
    svgRef,
    dimensions,
    zoomLevel: zoomLevel * 1.15, // Increase node size by 15%
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

  // Only render the visualization components if we have the SVG and data
  const renderVisualization = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />
      {renderVisualization && svgRef.current && (
        <>
          {/* Add starfield background */}
          <StarfieldBackground 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
          />
          
          {/* Render orbital visualization components */}
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={34.5 * (zoomLevel / 100) * 1.15} // Increase orbital radius by 15%
            extendFullScreen={true} // Extend orbit lines to full screen
          />
          <LinkRendererComponent 
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
            predictions={predictions}
            animateWithOrbit={true} // Enable orbital animation for links
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
            zoomLevel={zoomLevel * 1.25} // Increase node size by 25%
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
            rotationSpeed={0.00012} // Faster rotation (increased from 0.00004)
            updateLinksInRealTime={true} // Update links with orbital movement
          />
          
          {/* Add AI predictions overlay */}
          {predictions && predictions.length > 0 && (
            <PredictionOrbitalOverlay
              svg={d3.select(svgRef.current)}
              nodes={visualizationData.nodes}
              updateInterval={600000} // Update every 10 minutes
              predictions={predictions}
              chartTimeframe={chartTimeframe}
            />
          )}
        </>
      )}
    </div>
  );
};
