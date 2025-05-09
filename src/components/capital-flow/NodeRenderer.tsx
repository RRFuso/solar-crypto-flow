import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
}

export class NodeRenderer {
  constructor(props: NodeRendererProps) {
    this.renderNodes(props);
  }
  
  private renderNodes({ svg, nodes, centralNode, selectedNodeId, zoomLevel }: NodeRendererProps) {
    // Clean up previous nodes
    svg.selectAll('.nodes-group').remove();
    
    // Create new nodes group
    const nodesGroup = svg.append("g").attr("class", "nodes-group");
    
    // Create patterns for logo images
    this.createNodePatterns(svg, nodes);
    
    // Create node glows (auras) with color coding based on flow
    nodesGroup.selectAll('circle.node-glow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 1.6 * (zoomLevel / 100))
      .attr('fill', d => {
        // Color based on flow direction
        if (d.type === 'central') return 'rgba(247, 147, 26, 0.3)'; // Bitcoin orange for central
        if (d.inflow > d.outflow) return 'rgba(0, 255, 204, 0.3)'; // Green for inflow (#00ffcc)
        if (d.outflow > d.inflow) return 'rgba(255, 0, 102, 0.3)'; // Red for outflow (#ff0066)
        return 'rgba(0, 181, 216, 0.3)'; // Default blue for neutral
      })
      .attr('filter', 'blur(8px)');
    
    // Create main nodes
    const node = nodesGroup.selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .on('mouseenter', (event, d) => {
        // Show tooltip on hover
        const tooltip = svg.append('g')
          .attr('class', 'node-tooltip')
          .attr('transform', `translate(${d.x},${d.y - d.radius - 60})`);
        
        tooltip.append('rect')
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('x', -80)
          .attr('y', -40)
          .attr('width', 160)
          .attr('height', 55)
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('stroke', d.type === 'central' ? '#F7931A' : '#ffffff')
          .attr('stroke-width', 1);
        
        tooltip.append('text')
          .attr('x', 0)
          .attr('y', -20)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-weight', 'bold')
          .text(d.name || d.id);
        
        tooltip.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .text(`Value: ${d.value ? d.value.toLocaleString() : 'N/A'}`);
        
        const flowText = d.inflow > d.outflow 
          ? `Net Inflow: +${(d.inflow - d.outflow).toLocaleString()}`
          : d.outflow > d.inflow
          ? `Net Outflow: -${(d.outflow - d.inflow).toLocaleString()}`
          : 'Flow: Neutral';
        
        tooltip.append('text')
          .attr('x', 0)
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .attr('fill', d.inflow > d.outflow ? '#00ffcc' : d.outflow > d.inflow ? '#ff0066' : '#ffffff')
          .text(flowText);
        
        // Highlight this node on hover
        d3.select(event.currentTarget)
          .select('circle.node-circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 3);
      })
      .on('mouseleave', (event, d) => {
        // Remove tooltip
        svg.selectAll('.node-tooltip').remove();
        
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
    
    // Add circle with pattern fill and drop shadow
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius * (zoomLevel / 100))
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => {
        // Highlight the node if it's selected
        if (selectedNodeId === d.id) {
          return '#ffffff';
        }
        // Color based on flow direction
        if (d.type === 'central') return '#F7931A'; // Bitcoin orange for central
        if (d.inflow > d.outflow) return '#00ffcc'; // Green for inflow
        if (d.outflow > d.inflow) return '#ff0066'; // Red for outflow
        return '#00b5d8'; // Default blue for neutral
      })
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9)
      .attr('filter', d => {
        // Drop shadow filter based on flow direction
        if (d.type === 'central') return 'drop-shadow(0 0 8px rgba(247, 147, 26, 0.7))'; // Orange glow for central
        if (d.inflow > d.outflow) return 'drop-shadow(0 0 8px rgba(0, 255, 204, 0.7))'; // Green glow
        if (d.outflow > d.inflow) return 'drop-shadow(0 0 8px rgba(255, 0, 102, 0.7))'; // Red glow
        return 'drop-shadow(0 0 8px rgba(0, 181, 216, 0.7))'; // Blue glow for neutral
      });
    
    // Add node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (zoomLevel / 100) + 15)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, Math.min(14, d.radius * 0.4) * (zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .text(d => d.id);
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
}

// Component wrapper for React
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    new NodeRenderer(props);
    
    // Cleanup on unmount
    return () => {
      props.svg.selectAll('.nodes-group').remove();
      props.svg.selectAll('.node-tooltip').remove();
    };
  }, [props]);
  
  return null;
});
