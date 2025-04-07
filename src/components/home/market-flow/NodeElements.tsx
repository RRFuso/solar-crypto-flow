
import React from 'react';
import * as d3 from 'd3';
import { MarketIndex } from '@/types/indices';

interface NodeElementsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
}

export const createNodeElements = (props: NodeElementsProps) => {
  const { svg, nodes } = props;

  // Draw nodes (circles)
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
  
  // Add outer glow for better visibility
  node.append("circle")
    .attr("class", "outer-glow")
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => d.color)
    .attr("opacity", 0.15)
    .attr("filter", "blur(12px)"); // Stronger blur
  
  // Add inner glowing effect for planetary look
  node.append("circle")
    .attr("class", "glow")
    .attr("r", d => d.radius * 1.2)
    .attr("fill", d => d.color)
    .attr("opacity", 0.3)
    .attr("filter", "blur(6px)");
  
  // Add circles with gradient effect
  node.each(function(d) {
    const nodeGroup = d3.select(this);
    
    // Create unique gradient ID
    const gradientId = `gradient-${d.id}`;
    
    // Add gradient definition
    const gradient = svg.append("defs")
      .append("radialGradient")
      .attr("id", gradientId)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%");
      
    // Add gradient stops
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d3.color(d.color)?.brighter(0.5)?.toString() || d.color)
      .attr("stop-opacity", 0.9);
      
    gradient.append("stop")
      .attr("offset", "80%")
      .attr("stop-color", d.color)
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.color(d.color)?.darker(0.5)?.toString() || d.color)
      .attr("stop-opacity", 0.8);
      
    // Add main circle with gradient
    nodeGroup.append("circle")
      .attr("r", d.radius)
      .attr("fill", `url(#${gradientId})`)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);
  });
  
  // Add text (index name) - now with better visibility
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", "14px") // Larger font
    .attr("stroke", "rgba(0, 0, 0, 0.7)")
    .attr("stroke-width", "0.5px")
    .text(d => d.name);
  
  // Add percentage change with enhanced visibility
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.8em")
    .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .attr("stroke", "rgba(0, 0, 0, 0.8)") // Stronger outline
    .attr("stroke-width", "0.6px")
    .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");

  return node;
};
