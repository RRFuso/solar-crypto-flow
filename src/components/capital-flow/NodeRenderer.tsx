
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  centralNode: any;
  selectedNodeId?: string | null;
}

export class NodeRenderer {
  constructor(props: NodeRendererProps) {
    this.renderNodes(props);
  }
  
  private renderNodes({ svg, nodes, centralNode, selectedNodeId }: NodeRendererProps) {
    // First clear any existing nodes
    svg.selectAll('.nodes-group').remove();
    
    // Create nodes group
    const nodeGroup = svg.append("g").attr("class", "nodes-group");
    
    // Create defs for patterns (logos)
    const defs = svg.append("defs");
    
    // Create patterns for each node
    nodes.forEach(node => {
      const patternId = `logo-${node.id}`;
      const pattern = defs.append("pattern")
        .attr("id", patternId)
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternUnits", "objectBoundingBox");
        
      // Add image to pattern
      pattern.append("image")
        .attr("xlink:href", () => {
          // Try to get logo URL, fallback to a default if unavailable
          const logoUrl = getCryptoLogoUrl(node.id.toLowerCase()) || 
                        `https://cryptoicon-api.vercel.app/api/icon/${node.id.toLowerCase()}`;
          return logoUrl;
        })
        .attr("width", node.radius * 2)
        .attr("height", node.radius * 2)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .on("error", function() {
          // Fallback to a color pattern if image fails to load
          d3.select(this).attr("xlink:href", getFallbackLogoUrl());
        });
    });
    
    // Create node elements
    const node = nodeGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("id", d => `node-${d.id}`)
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        // Handle node selection
        const currentlySelected = selectedNodeId === d.id;
        
        // Reset all nodes and links to default state
        svg.selectAll(".node")
          .classed("selected", false)
          .selectAll("circle.node-circle")
          .attr("stroke-width", 2);
        
        svg.selectAll(".link")
          .attr("opacity", 0.7)
          .attr("stroke-width", link => 1 + Math.min(4, Math.abs(link.value)));
        
        // If this node wasn't already selected, highlight it and its connections
        if (!currentlySelected) {
          // Highlight this node
          d3.select(this).classed("selected", true)
            .select("circle.node-circle")
            .attr("stroke-width", 4);
          
          // Highlight connected links and fade others
          svg.selectAll(".link")
            .attr("opacity", link => {
              if (link.source.id === d.id || link.target.id === d.id) {
                return 1;
              } else {
                return 0.2;
              }
            })
            .attr("stroke-width", link => {
              if (link.source.id === d.id || link.target.id === d.id) {
                return 2 + Math.min(6, Math.abs(link.value));
              } else {
                return 1 + Math.min(4, Math.abs(link.value));
              }
            });
        }
      });
    
    // Add glow effect for nodes
    node.append("circle")
      .attr("class", "node-glow")
      .attr("r", d => d.radius * 1.3)
      .attr("fill", d => {
        const change = d.change || 0;
        // Color based on change percentage
        if (change > 0) return "rgba(52, 211, 153, 0.2)"; // Green for positive
        if (change < 0) return "rgba(248, 113, 113, 0.2)"; // Red for negative
        return "rgba(156, 163, 175, 0.2)"; // Gray for no change
      })
      .attr("filter", "url(#glow-filter)");
    
    // Create a circular background for logos
    node.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#logo-${d.id})`)
      .attr("stroke", d => {
        const change = d.change || 0;
        if (change > 0) return "#4ade80"; // Green for positive
        if (change < 0) return "#f43f5e"; // Red for negative
        return "#94a3b8"; // Gray for no change
      })
      .attr("stroke-width", 2);
    
    // Add crypto symbol text
    node.append("text")
      .attr("class", "symbol-text")
      .attr("dy", d => d.radius + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.id === centralNode.id ? "14px" : "12px")
      .text(d => d.id.toUpperCase());
    
    // Add percentage change text with appropriate handling for missing values
    node.append("text")
      .attr("class", "change-text")
      .attr("dy", d => d.radius + 32)
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        const change = d.change || 0;
        if (change > 0) return "#4ade80"; // Green for positive
        if (change < 0) return "#f43f5e"; // Red for negative
        return "#94a3b8"; // Gray for no change
      })
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text(d => {
        const change = d.change;
        // Handle missing or zero values
        if (change === undefined || change === null) return "--";
        if (change === 0) return "0.00%";
        return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
      });
    
    // Add SVG filter for glow effect if not already present
    if (!svg.select("#glow-filter").size()) {
      const filter = svg.append("defs")
        .append("filter")
        .attr("id", "glow-filter");
      
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "3.5")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
      feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");
    }
    
    // Add tooltips on hover
    node.append("title")
      .text(d => {
        const changeText = d.change !== undefined && d.change !== null 
          ? `${d.change > 0 ? "+" : ""}${d.change.toFixed(2)}%` 
          : "No data";
        const marketCapText = d.marketCap 
          ? `$${this.formatLargeNumber(d.marketCap)}` 
          : "Unknown";
        
        return `${d.name || d.id.toUpperCase()}\nMarket Cap: ${marketCapText}\nChange: ${changeText}`;
      });
  }
  
  private formatLargeNumber(num: number): string {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(2) + 'B';
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(2) + 'K';
    }
    return num.toString();
  }
}

// React component wrapper for the D3 renderer
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    new NodeRenderer(props);
    
    // Cleanup
    return () => {
      props.svg.selectAll(".nodes-group").remove();
    };
  }, [props]);
  
  return null;
});
