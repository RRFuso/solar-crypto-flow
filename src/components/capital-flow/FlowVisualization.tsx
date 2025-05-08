
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { OrbitLayersComponent } from './OrbitLayers';
import { LinkRendererComponent } from './LinkRenderer';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';
import { StarfieldBackground } from './visualization/StarfieldBackground';
import { useVisualizationSetup } from './visualization/useVisualizationSetup';
import { useVisualizationData } from './visualization/useVisualizationData';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  flowData,
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
  
  // Initialize visualization data
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

  // Apply static glow (drop-shadow) and remove animated halos
  useEffect(() => {
    if (svgRef.current && visualizationData.nodes.length > 0 && visualizationData.links.length > 0) {
      const svg = d3.select(svgRef.current);
      // Remove any existing animated halos/circles (if they exist)
      svg.selectAll('circle.halo').remove();
      svg.selectAll('circle.pulse').remove();
      // Apply drop shadows based on flow direction per node
      const centralId = visualizationData.centralNode?.id;
      visualizationData.nodes.forEach(node => {
        if (node.id === centralId) return; // skip central node
        const hasInflow = visualizationData.links.some(
          link => link.target.id === node.id && link.source.id === centralId
        );
        const hasOutflow = visualizationData.links.some(
          link => link.source.id === node.id && link.target.id === centralId
        );
        let color = '#0000FF'; // default blue for neutral
        if (hasInflow) color = '#00FF00';
        else if (hasOutflow) color = '#FF0000';
        // Apply CSS drop-shadow filter on the node element (assuming ID equals node.id)
        svg.select(`#${node.id}`).style('filter', `drop-shadow(0 0 8px ${color})`);
      });
    }
  }, [visualizationData]);

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
            baseRadius={30 * (zoomLevel / 100)} // Apply zoom to orbit radius
            extendFullScreen={true} // Extend orbit lines to full screen
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
