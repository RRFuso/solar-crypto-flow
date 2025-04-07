
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
  const { calculateOrbitalPositions, positionNodesInOrbits } = useOrbitalCalculations();

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
    createStarfield(svg, width, height);
    
    // Find central index (usually the most important one)
    const centralIndex = data.indices.find(index => index.id === 'SPY') || data.indices[0];
    
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
    const animationInterval = setInterval(() => {
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
    }, 50);
    
    // Cleanup on unmount
    return () => {
      clearInterval(animationInterval);
    };
  }, [data]);

  // Create starfield background
  const createStarfield = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 120;
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.2 + 0.2;
      const opacity = Math.random() * 0.4 + 0.1;
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add twinkling to some stars
      if (Math.random() > 0.8) {
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.5};${opacity}`)
          .attr("dur", `${3 + Math.random() * 4}s`)
          .attr("repeatCount", "indefinite");
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
