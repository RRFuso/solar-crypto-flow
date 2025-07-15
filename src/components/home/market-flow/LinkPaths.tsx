
import React from 'react';
import * as d3 from 'd3';
import { IndexLinkData } from '@/types/indices';

interface LinkPathsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: IndexLinkData[];
}

export const createLinkPaths = (props: LinkPathsProps) => {
  const { svg, links } = props;

  // Add global glow filter
  const defs = svg.append("defs");
  defs.append("filter")
    .attr("id", "glow")
    .append("feGaussianBlur")
    .attr("stdDeviation", "2.5")
    .attr("result", "coloredBlur");
  
  // Create gradients and markers for each link
  links.forEach((link: IndexLinkData, i) => {
    const markerId = `arrow-${i}`;
    const gradientId = `link-gradient-${i}`;
    
    // Create gradient for color transition - red to green for outflows, green to red for inflows
    const startColor = link.percentage > 0 ? "#ff3366" : "#4ade80"; // Red to Green
    const endColor = link.percentage > 0 ? "#4ade80" : "#ff3366"; // Green to Red
    
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", link.source.x)
      .attr("y1", link.source.y)
      .attr("x2", link.target.x)
      .attr("y2", link.target.y);
      
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", startColor)
      .attr("stop-opacity", 0.9);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", endColor)
      .attr("stop-opacity", 0.9);
    
    // Create arrowhead markers
    defs.append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", link.percentage > 0 ? "#4ade80" : "#ff3366")
      .attr("d", "M0,-5L10,0L0,5");
  });

  // Draw links with enhanced visibility and animation
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link-path")
    .attr("stroke", (d: IndexLinkData, i) => `url(#link-gradient-${i})`)
    .attr("stroke-width", (d: IndexLinkData) => 2 + Math.min(8, Math.sqrt(Math.abs(d.value)) / 3)) // Thickness based on volume
    .attr("fill", "none")
    .attr("stroke-dasharray", "8,4") // Dashed pattern
    .attr("opacity", 0.85) // Higher opacity for better visibility
    .attr("marker-end", (d: IndexLinkData, i) => `url(#arrow-${i})`)
    .attr("filter", "url(#glow)");
  
  return link;
};

// Update link paths based on node positions with enhanced curves
export const updateLinkPaths = (link: d3.Selection<SVGPathElement, IndexLinkData, SVGGElement, unknown>) => {
  if (!link) return; // Guard against null
  
  link.attr("d", (d: IndexLinkData) => {
    if (!d || !d.source || !d.target) return "";
    
    const sourceX = d.source.x || 0;
    const sourceY = d.source.y || 0;
    const targetX = d.target.x || 0;
    const targetY = d.target.y || 0;
    
    // Calculate distance for better curve adjustment
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // More pronounced curve for visual appeal
    const curveFactor = Math.min(distance / 2.5, 100); // Increased curve factor
    
    // Calculate perpendicular offset for curve
    const normX = -dy / distance;
    const normY = dx / distance;
    
    const curveX = (sourceX + targetX) / 2 + normX * curveFactor;
    const curveY = (sourceY + targetY) / 2 + normY * curveFactor;
    
    return `M${sourceX},${sourceY} Q${curveX},${curveY} ${targetX},${targetY}`;
  });
  
  // Update gradients positions
  link.each(function(d: IndexLinkData, i: number) {
    if (!d || !d.source || !d.target) return;
    
    const gradient = d3.select(`#link-gradient-${i}`);
    if (!gradient.empty()) {
      gradient
        .attr("x1", d.source.x)
        .attr("y1", d.source.y)
        .attr("x2", d.target.x)
        .attr("y2", d.target.y);
    }
  });
};
