
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
  selectedNodeId?: string | null;
}

export class NodeRenderer {
  constructor(props: NodeRendererProps) {
    this.renderNodes(props);
  }
  
  private renderNodes({ svg, nodes, centralNode, selectedNodeId }: NodeRendererProps) {
    // Clear any existing nodes first
    svg.selectAll('.nodes-group').remove();
    
    // Draw nodes with glowing effect
    const nodeGroup = svg.append("g").attr("class", "nodes-group");
    
    // Create defs for logo patterns
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
        .attr("xlink:href", () => {
          // Try to get logo URL, fallback to a color if unavailable
          const logoUrl = getCryptoLogoUrl(node.id.toLowerCase()) || 
                        `https://s2.coinmarketcap.com/static/img/coins/64x64/${node.id.toLowerCase()}.png` || 
                        `https://cryptocurrencyliveprices.com/img/${node.id.toLowerCase()}.png`;
          return logoUrl || getFallbackLogoUrl();
        })
        .attr("width", node.radius * 2 * 0.8) // 80% of the circle's diameter
        .attr("height", node.radius * 2 * 0.8)
        .attr("x", node.radius * 0.2) // Center the image
        .attr("y", node.radius * 0.2)
        .attr("preserveAspectRatio", "xMidYMid slice");
    });
    
    // Add selection highlight for selected node
    if (selectedNodeId) {
      const selectedNode = nodes.find(n => n.id === selectedNodeId);
      if (selectedNode) {
        nodeGroup.append("circle")
          .attr("class", "selection-highlight")
          .attr("cx", selectedNode.x)
          .attr("cy", selectedNode.y)
          .attr("r", selectedNode.radius * 1.8)
          .attr("fill", "none")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4")
          .attr("opacity", 0.7);
      }
    }
    
    // Add glowing effect around nodes
    nodeGroup.selectAll(".node-glow")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node-glow")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.radius * 1.5)
      .attr("fill", d => {
        // Highlight selected node with a brighter glow
        if (selectedNodeId === d.id) {
          return d.type === "central" ? "#F7931A" : "#00e5ff";
        }
        return d.type === "central" ? "#F7931A" : "#00b5d8";
      })
      .attr("opacity", d => selectedNodeId === d.id ? 0.5 : 0.3)
      .attr("filter", "blur(8px)");
    
    // Draw node circles
    const node = nodeGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer") // Add pointer cursor to indicate clickability
      .on("mouseover", function() {
        d3.select(this).select("circle").attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.select(this).select("circle").attr("stroke-width", 2);
      });
    
    // Add main circle with logo pattern
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#logo-${d.id})`) // Use pattern with logo
      .attr("stroke", d => {
        // Use different stroke colors based on selection state
        if (selectedNodeId === d.id) {
          return "#ffffff"; // White stroke for selected node
        }
        return d.type === "central" ? "#F7931A" : "#00b5d8"; // Bitcoin orange for central node
      })
      .attr("stroke-width", d => selectedNodeId === d.id ? 3 : 2)
      .attr("opacity", d => selectedNodeId && selectedNodeId !== d.id ? 0.7 : 0.9);
    
    // Add ticker text below
    node.append("text")
      .attr("class", "ticker")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 15)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.type === "central" ? "16px" : "14px")
      .attr("stroke", "rgba(0, 0, 0, 0.7)")  // Text outline
      .attr("stroke-width", "0.5px")         // Thin outline
      .text(d => d.id);
    
    // Add name text (when available)
    node.append("text")
      .attr("class", "name")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 33)
      .attr("fill", "rgba(255, 255, 255, 0.8)")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text(d => d.name && d.name !== d.id ? d.name.substring(0, 12) : "");
    
    // Add percentage change with better visibility
    node.append("text")
      .attr("class", "percentage")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 50)
      .attr("fill", d => d.change >= 0 ? "#4ade80" : "#f43f5e") // Green for positive, red for negative
      .attr("font-weight", "bold")
      .attr("font-size", "13px")
      .attr("stroke", "rgba(0, 0, 0, 0.8)") // Stronger outline for better visibility
      .attr("stroke-width", "0.6px")
      .text(d => (d.change >= 0 ? "+" : "") + (d.change ? d.change.toFixed(2) : "0.00") + "%");
    
    // Add pulsating animation to central node
    if (centralNode) {
      const centralNodeElement = node.filter(d => d.type === "central")
        .select("circle");
        
      function createPulse() {
        centralNodeElement.transition()
          .duration(1500)
          .attr("r", centralNode.radius * 1.1)
          .transition()
          .duration(1500)
          .attr("r", centralNode.radius)
          .on("end", createPulse);
      }
      
      createPulse();
    }
  }
}

// Fix component export for Fast Refresh compatibility
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    new NodeRenderer(props);
    
    // Clean up any D3 animations
    return () => {
      props.svg.selectAll(".node").selectAll("*").interrupt();
    };
  }, [props]);
  
  return null;
});
