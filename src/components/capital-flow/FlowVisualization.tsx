
import React, { useEffect, useRef } from 'react';
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
  
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Initialize visualization
    const { svg, width, height, nodes, links, centralNode } = createOrbitalVisualization(
      flowData, 
      svgRef.current, 
      containerRef.current
    );
    
    // Calculate orbit parameters
    const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(8, Math.ceil(nonCentralNodes.length / 4));
    const baseRadius = Math.min(width, height) * 0.45 / orbitLayers;
    
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
    new OrbitalAnimation({ svg, nodes, width, height });
    
    // Clean up on unmount
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, createOrbitalVisualization]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
