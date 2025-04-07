
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';
import { useOrbitalCalculations } from './useOrbitalCalculations';
import { createLinkPaths, updateLinkPaths } from './LinkPaths';
import { createNodeElements } from './NodeElements';
import { createOrbitalPaths } from './OrbitalPaths';

interface IndexFlowChartProps {
  data: IndexRotationResult;
}

export const IndexFlowChart: React.FC<IndexFlowChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const { calculateOrbitalPositions, positionNodesInOrbits, createStarfield } = useOrbitalCalculations();

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Add starfield background
    createStarfield(svg, width, height, 180);
    
    // Find central index (now DXY instead of Gold)
    const centralIndex = data.indices.find(index => index.id === 'DXY') || 
                        data.indices.find(index => index.id === 'SPY') || 
                        data.indices[0];
    
    // Create nodes for the indices
    const nodes = data.indices.map(index => {
      const isCentral = index.id === centralIndex.id;
      return {
        id: index.id,
        name: index.name,
        value: index.value || 0,
        change: index.change || 0,
        color: index.color,
        radius: isCentral ? 50 : 35, // Central node is larger
        x: 0,
        y: 0,
        isCentral
      };
    });
    
    // Create links from the flows
    const links = data.flows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    })).filter(link => link.source && link.target);
    
    // Calculate orbital distances - increasing spacing between orbits
    const orbitRadii = calculateOrbitalPositions(nodes, width, height);
    
    // Draw orbit paths
    createOrbitalPaths({ svg, nodes, width, height, orbitRadii });
    
    // Position nodes in orbital arrangement
    positionNodesInOrbits(nodes, width, height, orbitRadii);
    
    // Draw links (connections)
    const link = createLinkPaths({ svg, links });
    
    // Draw nodes (circles)
    const node = createNodeElements({ svg, nodes });
    
    // Update link positions
    updateLinkPaths(link);
    
    // Animation for orbital movement
    const animate = () => {
      // Create subtle orbital movement
      nodes.forEach((node, i) => {
        if (!node.isCentral) {
          const speed = 0.001; // Slow rotation speed
          const angle = Math.atan2(node.y - height/2, node.x - width/2) + speed;
          const radius = orbitRadii[i];
          
          node.x = width/2 + Math.cos(angle) * radius;
          node.y = height/2 + Math.sin(angle) * radius;
        }
      });
      
      // Update node positions
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
      
      // Update link positions
      updateLinkPaths(link);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default IndexFlowChart;
