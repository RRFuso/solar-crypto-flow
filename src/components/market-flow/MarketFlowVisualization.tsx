import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface MarketFlowVisualizationProps {
  data: IndexRotationResult;
}

export const MarketFlowVisualization: React.FC<MarketFlowVisualizationProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = 350;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create nodes for indices
    const nodes = data.indices.map(index => ({
      id: index.id,
      name: index.name,
      value: index.value || 0,
      change: index.change || 0,
      radius: 30, // Base radius
      color: index.color,
      x: 0,
      y: 0
    }));
    
    // Create links from flows
    const links = data.flows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    }));
    
    // Set up force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as any).radius + 25))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2).strength(0.08));
    
    // Add boundary forces to keep nodes in view
    simulation.on("tick", () => {
      nodes.forEach((node: any) => {
        const padding = node.radius || 30;
        node.x = Math.max(padding, Math.min(width - padding, node.x || 0));
        node.y = Math.max(padding, Math.min(height - padding, node.y || 0));
      });
    });
    
    // Draw links
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("line")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("stroke-width", d => 2 + (Math.abs(d.value) / 10) * 6)
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10")
      .attr("opacity", 0.7);
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Animate the flow
    link.each(function(d, i) {
      // Create animated flow effect
      svg.append("circle")
        .attr("r", 3)
        .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
        .attr("class", "flow-particle")
        .attr("opacity", 0.8)
        .append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0;1;0")
        .attr("dur", "4s")
        .attr("repeatCount", "indefinite");
    });
    
    // Draw circles for nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles with index colors
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#0ea5e9")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);
    
    // Add text (index name and change percentage)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(d => d.name);
    
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", d => d.change >= 0 ? "#00ffcc" : "#ff0066")
      .attr("font-weight", "bold")
      .attr("font-size", "10px")
      .text(d => (d.change >= 0 ? "+" : "") + d.change + "%");
    
    // Add pulsating effect
    node.selectAll("circle")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius};${d.radius * 1.05};${d.radius}`)
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
    
    // Update positions on each tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      nodes.forEach((d: any) => {
        const radius = d.radius || 30;
        d.x = Math.max(radius, Math.min(width - radius, d.x || 0));
        d.y = Math.max(radius, Math.min(height - radius, d.y || 0));
      });
      
      link.attr("d", (d: any) => {
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
      });
      
      svg.selectAll(".flow-particle")
        .attr("transform", function(d, i) {
          const link = links[i % links.length];
          if (!link) return "";
          
          const t = (Date.now() / 100) % 100 / 100;
          
          // Interpolate position along the path
          const path = svg.select(`.link:nth-child(${(i % links.length) + 1})`).node();
          if (!path) return "";
          
          try {
            const point = (path as any).getPointAtLength((path as any).getTotalLength() * t);
            return `translate(${point.x}, ${point.y})`;
          } catch (e) {
            return "";
          }
        });
      
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return () => {
      simulation.stop();
      d3.select(svgRef.current).selectAll("*").remove();
    };
    
  }, [data]);
  
  return (
    <div ref={containerRef} className="w-full flex-1">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
