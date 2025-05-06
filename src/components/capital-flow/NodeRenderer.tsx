
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
    
    // Create filter for glow effect
    const defs = svg.select('defs');
    if (defs.empty()) {
      svg.append('defs');
    }
    
    svg.select('defs')
      .append("filter")
      .attr("id", "glow-effect")
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    
    // Create node glows (auras)
    nodesGroup.selectAll('circle.node-glow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 1.6 * (zoomLevel / 100))
      .attr('fill', d => d.type === 'central' ? 'rgba(247, 147, 26, 0.3)' : 'rgba(0, 181, 216, 0.3)')
      .attr('filter', 'blur(8px)');
    
    // Add capital flow glow for nodes with positive/negative flow
    nodesGroup.selectAll('circle.flow-glow')
      .data(nodes.filter(d => d.flowValue !== 0 && d.flowValue !== undefined))
      .enter()
      .append('circle')
      .attr('class', 'flow-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 1.8 * (zoomLevel / 100))
      .attr('fill', 'none')
      .attr('stroke', d => d.flowValue && d.flowValue > 0 ? '#00ff00' : '#ff0000')
      .attr('stroke-width', 8)
      .attr('stroke-opacity', 0.6)
      .attr('filter', 'url(#glow-effect)');
    
    // Create main nodes
    const node = nodesGroup.selectAll('g.node')
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
    
    // Add circle with pattern fill
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius * (zoomLevel / 100))
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
    
    // Add node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (zoomLevel / 100) + 15)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, Math.min(14, d.radius * 0.4) * (zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .text(d => d.id);
    
    // Add pulse animation to central node
    if (centralNode) {
      const pulseNode = node.filter(d => d.id === centralNode.id);
      
      pulseNode.append('circle')
        .attr('class', 'pulse-circle')
        .attr('r', centralNode.radius * 1.2 * (zoomLevel / 100))
        .attr('fill', 'none')
        .attr('stroke', '#F7931A')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
        .call(selection => {
          selection.transition()
            .attr('stroke-opacity', 0.7)
            .attr('r', d => d.radius * 1.2 * (zoomLevel / 100))
            .duration(2000)
            .transition()
            .attr('stroke-opacity', 0.1)
            .attr('r', d => d.radius * 1.6 * (zoomLevel / 100))
            .duration(2000)
            .on('end', function repeat() {
              d3.select(this)
                .transition()
                .attr('stroke-opacity', 0.7)
                .attr('r', d => d.radius * 1.2 * (zoomLevel / 100))
                .duration(2000)
                .transition()
                .attr('stroke-opacity', 0.1)
                .attr('r', d => d.radius * 1.6 * (zoomLevel / 100))
                .duration(2000)
                .on('end', repeat);
            });
        });
    }
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
    };
  }, [props]);
  
  return null;
});
