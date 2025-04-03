
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitLayers } from './OrbitLayers';
import { NodePlacement } from './NodePlacement';
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
  
  // Store visualization state
  const [visualizationState, setVisualizationState] = React.useState<{
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
    width: number;
    height: number;
    nodes: any[];
    links: any[];
    centralNode: any;
    orbitLayers: number;
    baseRadius: number;
  }>({
    svg: null,
    width: 0,
    height: 0,
    nodes: [],
    links: [],
    centralNode: null,
    orbitLayers: 0,
    baseRadius: 0
  });

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
    
    // Calculate orbit parameters - increased spacing to avoid overlaps
    const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(8, Math.ceil(nonCentralNodes.length / 4));
    const baseRadius = Math.min(width, height) * 0.45 / orbitLayers;
    
    // Update state
    setVisualizationState({
      svg,
      width,
      height,
      nodes,
      links,
      centralNode,
      orbitLayers,
      baseRadius
    });
    
    // Clean up on unmount
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, createOrbitalVisualization]);

  // If we don't have visualization state yet, don't render the components
  if (!visualizationState.svg) return null;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      
      <OrbitLayers 
        svg={visualizationState.svg}
        width={visualizationState.width}
        height={visualizationState.height}
        orbitLayers={visualizationState.orbitLayers}
        baseRadius={visualizationState.baseRadius}
      />
      
      <NodePlacement 
        nodes={visualizationState.nodes}
        centralNode={visualizationState.centralNode}
        width={visualizationState.width}
        height={visualizationState.height}
        orbitLayers={visualizationState.orbitLayers}
        baseRadius={visualizationState.baseRadius}
      />
      
      <LinkRenderer 
        svg={visualizationState.svg}
        links={visualizationState.links}
      />
      
      <NodeRenderer 
        svg={visualizationState.svg}
        nodes={visualizationState.nodes}
        centralNode={visualizationState.centralNode}
      />
      
      <OrbitalAnimation 
        svg={visualizationState.svg}
        nodes={visualizationState.nodes}
        width={visualizationState.width}
        height={visualizationState.height}
      />
    </div>
  );
};
