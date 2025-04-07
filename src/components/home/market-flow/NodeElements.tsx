
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
  
  // Add glowing effect for planetary look
  node.append("circle")
    .attr("class", "glow")
    .attr("r", d => d.radius * 1.2)
    .attr("fill", d => d.color)
    .attr("opacity", 0.3)
    .attr("filter", "blur(8px)"); // Add blur for better glow effect
  
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
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", "13px") // Slightly larger
    .attr("stroke", "rgba(0, 0, 0, 0.7)") // Text outline for better visibility
    .attr("stroke-width", "0.5px")
    .text(d => d.name);
  
  // Add percentage change - now with better visibility
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.6em")
    .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e") // Maintain color for trend indication
    .attr("font-weight", "bold")
    .attr("font-size", "12px") // Slightly larger
    .attr("stroke", "rgba(0, 0, 0, 0.7)") // Stronger outline for better visibility
    .attr("stroke-width", "0.5px")
    .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");

  return node;
};
