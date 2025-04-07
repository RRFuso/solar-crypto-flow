
import React from 'react';
import * as d3 from 'd3';

interface LinkPathsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
}

export const createLinkPaths = (props: LinkPathsProps) => {
  const { svg, links } = props;

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
    .attr("opacity", 0.7) // Slightly more visible
    .attr("marker-end", (d, i) => `url(#arrow-${i})`);
  
  // Add glow effect to links
  svg.append("defs").append("filter")
    .attr("id", "glow")
    .append("feGaussianBlur")
    .attr("stdDeviation", "2")
    .attr("result", "coloredBlur");
  
  // Apply glow filter
  link.attr("filter", "url(#glow)");
  
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

  return link;
};

// Update link paths based on node positions
export const updateLinkPaths = (link: d3.Selection<SVGPathElement, any, SVGGElement, unknown>) => {
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
    const curveFactor = Math.min(distance / 3, 60); // Increased curve factor
    
    // Calculate perpendicular offset for curve
    const normX = -dy / distance;
    const normY = dx / distance;
    
    const curveX = midX + normX * curveFactor;
    const curveY = midY + normY * curveFactor;
    
    return `M${sourceX},${sourceY} Q${curveX},${curveY} ${targetX},${targetY}`;
  });
};
