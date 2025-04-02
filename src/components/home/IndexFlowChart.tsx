
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';

interface IndexFlowChartProps {
  data: IndexRotationResult;
}

export const IndexFlowChart: React.FC<IndexFlowChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
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
    
    // Calculate orbital distances
    const orbitRadii = calculateOrbitalPositions(nodes, width, height);
    
    // Draw orbit paths
    nodes.forEach((node, i) => {
      if (!node.isCentral) {
        const orbitPath = svg.append("circle")
          .attr("cx", width / 2)
          .attr("cy", height / 2)
          .attr("r", orbitRadii[i])
          .attr("fill", "none")
          .attr("stroke", "rgba(255, 255, 255, 0.1)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");
      }
    });
    
    // Position nodes in orbital arrangement
    positionNodesInOrbits(nodes, width, height, orbitRadii);
    
    // Draw links (connections)
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e") // Vibrant colors
      .attr("stroke-width", d => 2 + Math.min(5, Math.abs(d.value) / 10))
      .attr("fill", "none")
      .attr("stroke-dasharray", "5,5")
      .attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Add arrows
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter()
      .append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#4ade80" : "#f43f5e") // Match link colors
      .attr("d", "M0,-5L10,0L0,5");
    
    // Draw nodes (circles)
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // Add glowing effect for planetary look
    node.append("circle")
      .attr("class", "glow")
      .attr("r", d => d.radius * 1.2)
      .attr("fill", d => d.color)
      .attr("opacity", 0.3);
    
    // Add circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);
    
    // Add text (index name) - now in white
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white") // Changed to white
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(d => d.name);
    
    // Add percentage change - now with better visibility
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e") // Maintain color for trend indication
      .attr("font-weight", "bold")
      .attr("font-size", "11px")
      .attr("stroke", "rgba(0, 0, 0, 0.5)") // Add subtle outline for better visibility
      .attr("stroke-width", "0.3px")
      .text(d => (d.change >= 0 ? "+" : "") + d.change.toFixed(2) + "%");
    
    // Update link positions
    updateLinkPaths();
    
    // Animation for orbital movement
    setInterval(() => {
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
      updateLinkPaths();
    }, 50);
    
    // Calculate orbital positions for planetary-like arrangement
    function calculateOrbitalPositions(nodes, width, height) {
      const centralIndex = nodes.findIndex(n => n.isCentral);
      const minRadius = Math.min(width, height) * 0.15;
      const maxRadius = Math.min(width, height) * 0.35;
      
      // Calculate spacing between orbits
      const nonCentralNodes = nodes.filter(n => !n.isCentral);
      const orbitStep = (maxRadius - minRadius) / (nonCentralNodes.length > 0 ? nonCentralNodes.length : 1);
      
      // Assign orbit radii
      return nodes.map((n, i) => {
        if (n.isCentral) return 0;
        
        // How many non-central nodes came before this one
        const nonCentralIndex = nodes.slice(0, i).filter(node => !node.isCentral).length;
        return minRadius + (nonCentralIndex * orbitStep);
      });
    }
    
    // Position nodes in orbits
    function positionNodesInOrbits(nodes, width, height, orbitRadii) {
      // Central node in the middle
      nodes.forEach((node, i) => {
        if (node.isCentral) {
          node.x = width / 2;
          node.y = height / 2;
        } else {
          // Distribute non-central nodes around their orbits
          const nonCentralIndex = nodes.slice(0, i).filter(n => !n.isCentral).length;
          const totalNonCentral = nodes.filter(n => !n.isCentral).length;
          const angle = (nonCentralIndex / totalNonCentral) * Math.PI * 2;
          
          node.x = width/2 + Math.cos(angle) * orbitRadii[i];
          node.y = height/2 + Math.sin(angle) * orbitRadii[i];
        }
      });
    }
    
    // Update link paths based on node positions
    function updateLinkPaths() {
      link.attr("d", (d: any) => {
        const sourceX = d.source.x || 0;
        const sourceY = d.source.y || 0;
        const targetX = d.target.x || 0;
        const targetY = d.target.y || 0;
        
        // Calculate midpoint with curve
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        // Add some curvature
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More pronounced curve for longer distances
        const curveFactor = Math.min(distance / 4, 50);
        
        // Calculate perpendicular offset for curve
        const normX = -dy / distance;
        const normY = dx / distance;
        
        const curveX = midX + normX * curveFactor;
        const curveY = midY + normY * curveFactor;
        
        return `M${sourceX},${sourceY} Q${curveX},${curveY} ${targetX},${targetY}`;
      });
    }
    
    // Cleanup on unmount
    return () => {
      clearInterval();
    };
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
