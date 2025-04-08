
import React from 'react';
import * as d3 from 'd3';
import { MarketIndex } from '@/types/indices';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface NodeElementsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
}

export const createNodeElements = (props: NodeElementsProps) => {
  const { svg, nodes } = props;

  // Create defs for logo image patterns
  const defs = svg.append("defs");
  
  // Create patterns for each node to hold the logo
  nodes.forEach(node => {
    const patternId = `logo-${node.id}`;
    const pattern = defs.append("pattern")
      .attr("id", patternId)
      .attr("width", 1)
      .attr("height", 1)
      .attr("patternUnits", "objectBoundingBox");
      
    // Add image to pattern
    pattern.append("image")
      .attr("xlink:href", (d) => {
        // Try to get logo URL, fallback to a color if unavailable
        const logoUrl = getCryptoLogoUrl(node.id.toLowerCase()) || 
                      getFallbackLogoUrl(node.id.toLowerCase());
        return logoUrl || `https://cryptocurrencyliveprices.com/img/${node.id.toLowerCase()}.png`;
      })
      .attr("width", node.radius * 2 * 0.8) // 80% of the circle's diameter
      .attr("height", node.radius * 2 * 0.8)
      .attr("x", node.radius * 0.2) // Center the image
      .attr("y", node.radius * 0.2)
      .attr("preserveAspectRatio", "xMidYMid slice");
  });

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
    
    // Add logo at the top of the circle
    const logoPadding = d.radius * 0.5;
    const logoSize = d.radius * 0.8;
    
    nodeGroup.append("image")
      .attr("xlink:href", () => {
        // Try to get logo URL, fallback to a color if unavailable
        const logoUrl = getCryptoLogoUrl(d.id.toLowerCase()) || 
                      getFallbackLogoUrl(d.id.toLowerCase());
        return logoUrl || `https://cryptocurrencyliveprices.com/img/${d.id.toLowerCase()}.png`;
      })
      .attr("x", -logoSize / 2)
      .attr("y", -d.radius * 0.8) // Position at top
      .attr("width", logoSize)
      .attr("height", logoSize)
      .attr("preserveAspectRatio", "xMidYMid slice")
      .on("error", function() {
        // If image fails to load, replace with a colored circle
        d3.select(this)
          .attr("xlink:href", null)
          .remove();
          
        nodeGroup.append("circle")
          .attr("cx", 0)
          .attr("cy", -d.radius * 0.6)
          .attr("r", logoSize / 2)
          .attr("fill", d.color);
      });
  });
  
  // Add ticker text (index name)
  node.append("text")
    .attr("class", "ticker")
    .attr("text-anchor", "middle")
    .attr("dy", ".1em")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", d => d.isCentral ? "16px" : "14px") // Larger font for central node
    .attr("stroke", "rgba(0, 0, 0, 0.7)")
    .attr("stroke-width", "0.5px")
    .text(d => d.id); // Using ID as ticker
  
  // Add percentage change with enhanced visibility
  node.append("text")
    .attr("class", "percentage")
    .attr("text-anchor", "middle")
    .attr("dy", "1.8em")
    .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e")
    .attr("font-weight", "bold")
    .attr("font-size", "13px")
    .attr("stroke", "rgba(0, 0, 0, 0.8)") // Stronger outline
    .attr("stroke-width", "0.6px")
    .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");

  // Add tooltips on hover
  node.on("mouseover", function(event, d) {
    const tooltip = svg.append("g")
      .attr("class", "tooltip")
      .attr("transform", `translate(${d.x},${d.y - d.radius - 80})`); // Position above the node
    
    // Add tooltip background
    tooltip.append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("x", -90)
      .attr("y", -50)
      .attr("width", 180)
      .attr("height", 70)
      .attr("fill", "rgba(0, 0, 0, 0.8)")
      .attr("stroke", d.color)
      .attr("stroke-width", 1);
    
    // Add tooltip content
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text(d.name); // Full name
    
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(`Market Cap: $${formatValue(d.value)}`);
    
    tooltip.append("text")
      .attr("x", 0)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(`Change: ${(d.change >= 0 ? "+" : "") + d.change.toFixed(2)}%`);
    
    d3.select(this).style("cursor", "pointer");
  })
  .on("mouseout", function() {
    svg.selectAll(".tooltip").remove();
    d3.select(this).style("cursor", "default");
  });

  return node;
};

// Helper function to format market cap values
function formatValue(value: number): string {
  if (!value) return "N/A";
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else {
    return `${value.toFixed(0)}`;
  }
}
