
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitLayersComponent } from './OrbitLayers';
import { NodePlacementComponent, calculateNodePositions, OrbitalNode } from './NodePlacement';
import { LinkRendererComponent } from './LinkRenderer';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';

interface FlowVisualizationProps {
  flowData: FlowData[];
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ flowData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visualizationData, setVisualizationData] = useState<{
    nodes: OrbitalNode[],
    links: any[],
    centralNode: OrbitalNode | null
  }>({ nodes: [], links: [], centralNode: null });
  const animationRef = useRef<any | null>(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(700, containerRef.current.clientHeight) // Increased minimum height
        });
      }
    };
    
    // Initial sizing
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Clean up previous animation
    if (animationRef.current) {
      try {
        if (typeof animationRef.current.cleanup === 'function') {
          animationRef.current.cleanup();
        }
      } catch (e) {
        console.error("Error cleaning up animation:", e);
      }
      animationRef.current = null;
    }
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Initialize visualization
    const { svg, nodes, links, centralNode } = createOrbitalVisualization(
      flowData, 
      svgRef.current, 
      width,
      height
    );
    
    // Ensure we have nodes and links
    if (nodes.length === 0) {
      console.error("No nodes created from flow data");
      return;
    }
    
    // Calculate orbit parameters
    const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(8, Math.ceil(nonCentralNodes.length / 3)); // Fewer nodes per orbit
    const baseRadius = Math.min(width, height) * 0.35 / orbitLayers;
    
    // Position nodes
    const nodePositionsProps = { nodes, centralNode, width, height, orbitLayers, baseRadius };
    calculateNodePositions(nodePositionsProps);
    
    // Store visualization data for rendering
    setVisualizationData({ nodes, links, centralNode });
    
    // Render visualization components
    return () => {
      // Component cleanup
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, createOrbitalVisualization]);

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
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={30}
          />
          <LinkRendererComponent 
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
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
