
import React from 'react';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';
import { createLinkPaths, updateLinkPaths } from './market-flow/LinkPaths';
import { createNodeElements } from './market-flow/NodeElements';
import { createOrbitalPaths, createStarfield } from './market-flow/OrbitalPaths';

interface IndexFlowChartProps {
  data: IndexRotationResult;
}

const IndexFlowChart: React.FC<IndexFlowChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

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

  // Orbital calculation functions
  const calculateOrbitalPositions = (nodes: any[], width: number, height: number) => {
    const minRadius = Math.min(width, height) * 0.28; // Increased from 0.25
    const maxRadius = Math.min(width, height) * 0.48; // Maximum radius
    
    // Calculate spacing between orbits - ensure more space between each orbit
    const nonCentralNodes = nodes.filter(n => !n.isCentral);
    const orbitStep = (maxRadius - minRadius) / (nonCentralNodes.length > 0 ? nonCentralNodes.length : 1);
    
    // Assign orbit radii with increased spacing
    return nodes.map((n, i) => {
      if (n.isCentral) return 0;
      
      // How many non-central nodes came before this one
      const nonCentralIndex = nodes.slice(0, i).filter(node => !node.isCentral).length;
      // Add extra spacing between orbits using a multiplier of 1.2
      return minRadius + (nonCentralIndex * orbitStep * 1.2);
    });
  };
  
  // Position nodes in orbits with improved spacing
  const positionNodesInOrbits = (nodes: any[], width: number, height: number, orbitRadii: number[]) => {
    // Central node in the middle
    nodes.forEach((node, i) => {
      if (node.isCentral) {
        node.x = width / 2;
        node.y = height / 2;
      } else {
        // Distribute non-central nodes around their orbits
        const nonCentralIndex = nodes.slice(0, i).filter(n => !n.isCentral).length;
        
        // Calculate angles with better distribution using golden ratio
        const goldRatio = 1.618033988749895;
        const angle = (nonCentralIndex * goldRatio * Math.PI * 2) % (Math.PI * 2);
        
        node.x = width/2 + Math.cos(angle) * orbitRadii[i];
        node.y = height/2 + Math.sin(angle) * orbitRadii[i];
      }
    });
    
    return nodes;
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default IndexFlowChart;
