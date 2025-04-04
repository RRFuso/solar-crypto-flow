
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitLayers } from './OrbitLayers';
import { NodePlacement, calculateNodePositions } from './NodePlacement';
import { LinkRenderer } from './LinkRenderer';
import { NodeRenderer } from './NodeRenderer';
import { OrbitalAnimation } from './OrbitalAnimation';

interface FlowVisualizationProps {
  flowData: FlowData[];
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ flowData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<OrbitalAnimation | null>(null);
  
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
      animationRef.current.cleanup();
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
    
    // Draw orbit circles
    const orbitsProps = { svg, width, height, orbitLayers, baseRadius };
    new OrbitLayers(orbitsProps);
    
    // Position nodes
    const nodePositionsProps = { nodes, centralNode, width, height, orbitLayers, baseRadius };
    calculateNodePositions(nodePositionsProps);
    
    // Draw links with arrows and flow indicators
    new LinkRenderer({ svg, links });
    
    // Draw nodes with labels
    new NodeRenderer({ svg, nodes, centralNode });
    
    // Add orbital animation
    animationRef.current = new OrbitalAnimation({ svg, nodes, width, height });
    
    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.cleanup();
      }
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, createOrbitalVisualization]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
