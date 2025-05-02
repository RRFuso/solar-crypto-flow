
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
}

export class NodeRenderer {
  private nodesGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private glowGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private tooltipData: { [key: string]: { price: string; volume: string } } = {};
  private priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  private volumeFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
  
  constructor(props: NodeRendererProps) {
    this.renderNodes(props);
  }
  
  private renderNodes({ svg, nodes, centralNode, selectedNodeId, zoomLevel }: NodeRendererProps) {
    // Clean up previous nodes
    svg.selectAll('.nodes-group').remove();
    svg.selectAll('.glows-group').remove();
    
    // Create separate group for glows (lower z-index)
    this.glowGroup = svg.append("g").attr("class", "glows-group");
    
    // Create new nodes group (higher z-index)
    this.nodesGroup = svg.append("g").attr("class", "nodes-group");
    
    // Create patterns for logo images
    this.createNodePatterns(svg, nodes);
    
    // Create node glows (halos) that move with the nodes
    const glows = this.glowGroup.selectAll('circle.node-glow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 1.8 * (zoomLevel / 100)) // Increased glow size
      .attr('fill', d => d.type === 'central' ? 'rgba(247, 147, 26, 0.3)' : 'rgba(0, 181, 216, 0.3)')
      .attr('filter', 'blur(8px)');
    
    // Create main nodes
    const node = this.nodesGroup.selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .on('mouseenter', (event, d) => {
        // Highlight this node on hover
        d3.select(event.currentTarget)
          .select('circle.node-circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 3);
      })
      .on('mouseleave', (event, d) => {
        // Return to normal state if not selected
        if (selectedNodeId !== d.id) {
          d3.select(event.currentTarget)
            .select('circle.node-circle')
            .transition() 
            .duration(200)
            .attr('stroke-width', 2);
        }
      })
      .on('click', (event, d) => {
        // Handle node selection for highlighting flows
        console.log(`Node clicked: ${d.id}`);
        
        // Trigger an event to notify parent components
        const clickEvent = new CustomEvent('node-click', {
          detail: { nodeId: d.id }
        });
        document.dispatchEvent(clickEvent);
      });
    
    // Add circle with pattern fill - increased size by 30%
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius * (zoomLevel / 100) * 1.3) // Increased size by 30%
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => {
        // Highlight the node if it's selected
        if (selectedNodeId === d.id) {
          return '#ffffff';
        }
        return d.type === 'central' ? '#F7931A' : '#00b5d8';
      })
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9);
    
    // Add custom tooltip with price and volume data
    this.addNodeTooltips(svg, node);
    
    // Add node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (zoomLevel / 100) * 1.3 + 15) // Adjust for larger nodes
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, Math.min(14, d.radius * 0.4) * (zoomLevel / 100) * 1.2)) // Increased font size slightly
      .attr('font-weight', 'bold')
      .text(d => d.id);
    
    // Add pulse animation to central node
    if (centralNode) {
      const pulseNode = node.filter(d => d.id === centralNode.id);
      
      pulseNode.append('circle')
        .attr('class', 'pulse-circle')
        .attr('r', centralNode.radius * 1.2 * (zoomLevel / 100) * 1.3) // Adjust for larger nodes
        .attr('fill', 'none')
        .attr('stroke', '#F7931A')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
        .call(selection => {
          selection.transition()
            .attr('stroke-opacity', 0.7)
            .attr('r', d => d.radius * 1.2 * (zoomLevel / 100) * 1.3)
            .duration(2000)
            .transition()
            .attr('stroke-opacity', 0.1)
            .attr('r', d => d.radius * 1.6 * (zoomLevel / 100) * 1.3)
            .duration(2000)
            .on('end', function repeat() {
              d3.select(this)
                .transition()
                .attr('stroke-opacity', 0.7)
                .attr('r', d => d.radius * 1.2 * (zoomLevel / 100) * 1.3)
                .duration(2000)
                .transition()
                .attr('stroke-opacity', 0.1)
                .attr('r', d => d.radius * 1.6 * (zoomLevel / 100) * 1.3)
                .duration(2000)
                .on('end', repeat);
            });
        });
    }
  }
  
  // Add tooltips with price and volume information
  private addNodeTooltips(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, 
                         node: d3.Selection<SVGGElement, OrbitalNode, SVGGElement, unknown>) {
    // Create tooltip container
    const tooltip = svg.append("g")
      .attr("class", "node-tooltip")
      .style("display", "none");
      
    // Background rectangle
    tooltip.append("rect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("width", 200)
      .attr("height", 100)
      .attr("fill", "rgba(0, 0, 0, 0.85)")
      .attr("stroke", "#00b5d8")
      .attr("stroke-width", 1);
      
    // Tooltip content
    const content = tooltip.append("g");
    
    // Title
    content.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "14px");
      
    // Price
    content.append("text")
      .attr("x", 10)
      .attr("y", 45)
      .attr("fill", "white")
      .attr("font-size", "12px");
      
    // Volume
    content.append("text")
      .attr("x", 10)
      .attr("y", 65)
      .attr("fill", "white")
      .attr("font-size", "12px");
      
    // Predictions (if available)
    content.append("text")
      .attr("x", 10)
      .attr("y", 85)
      .attr("font-size", "12px");
      
    // Show tooltip on mouseenter
    node.on("mouseenter.tooltip", (event, d) => {
      // Get latest market data from window object if available
      let price = "--";
      let volume = "--";
      let priceColor = "white";
      
      // Try to access market data from global object
      const marketData = (window as any).cryptoMarketData;
      if (marketData && marketData[d.id]) {
        const data = marketData[d.id];
        
        // Format price and volume
        price = this.priceFormatter.format(data.price || 0);
        volume = this.volumeFormatter.format(data.volume || 0);
        
        // Set price color based on change
        if (data.priceChangePercent) {
          priceColor = parseFloat(data.priceChangePercent) >= 0 ? "#4ade80" : "#f43f5e";
        }
      }
      
      // Position tooltip near the mouse
      tooltip
        .attr("transform", `translate(${d.x + 20},${d.y - 50})`)
        .style("display", null);
      
      // Update content
      content.select("text:nth-child(1)")
        .text(`${d.id}/USDT`);
        
      content.select("text:nth-child(2)")
        .text(`Price: ${price}`)
        .attr("fill", priceColor);
        
      content.select("text:nth-child(3)")
        .text(`Volume: ${volume}`);
        
      // Update prediction if available (from global data)
      const predictions = (window as any).cryptoPredictions;
      if (predictions && predictions[d.id]) {
        const prediction = predictions[d.id];
        const sentiment = prediction.bullish ? "Bullish" : "Bearish";
        const confidence = Math.round(prediction.confidence * 100);
        const color = prediction.bullish ? "#4ade80" : "#f43f5e";
        
        content.select("text:nth-child(4)")
          .text(`AI: ${sentiment} ${confidence}%`)
          .attr("fill", color);
      } else {
        content.select("text:nth-child(4)")
          .text("No prediction available")
          .attr("fill", "#888888");
      }
    });
    
    // Hide tooltip on mouseleave
    node.on("mouseleave.tooltip", () => {
      tooltip.style("display", "none");
    });
  }
  
  private createNodePatterns(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: OrbitalNode[]) {
    // Remove any existing patterns
    svg.select('defs').remove();
    
    // Create definitions for patterns
    const defs = svg.append('defs');
    
    // Create a pattern for each node
    nodes.forEach(node => {
      const pattern = defs.append('pattern')
        .attr('id', `logo-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');
      
      // Get logo URL from our utility
      const logoUrl = getCryptoLogoUrl(node.id);
      
      // Add logo image with fallback
      pattern.append('image')
        .attr('href', logoUrl)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function() {
          // If primary logo fails, use fallback
          d3.select(this).attr('href', getFallbackLogoUrl());
        });
    });
  }
  
  // Method to update node and glow positions during animation
  public updatePositions() {
    if (!this.nodesGroup || !this.glowGroup) return;
    
    // Update node positions
    this.nodesGroup.selectAll('g.node')
      .attr('transform', d => `translate(${d.x},${d.y})`);
      
    // Synchronize glow positions with nodes
    this.glowGroup.selectAll('circle.node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }
}

// Component wrapper for React
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const nodeRendererRef = React.useRef<NodeRenderer | null>(null);
  
  useEffect(() => {
    // Create node renderer
    nodeRendererRef.current = new NodeRenderer(props);
    
    // Update positions on node changes
    const updateNodePositions = () => {
      if (nodeRendererRef.current) {
        nodeRendererRef.current.updatePositions();
      }
      requestAnimationFrame(updateNodePositions);
    };
    
    // Start animation loop
    const animationFrameId = requestAnimationFrame(updateNodePositions);
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      props.svg.selectAll('.nodes-group').remove();
      props.svg.selectAll('.glows-group').remove();
      props.svg.selectAll('.node-tooltip').remove();
    };
  }, [props]);
  
  return null;
});
