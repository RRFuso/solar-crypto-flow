
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

export class OrbitalAnimation {
  private animationId: number | null = null;

  constructor(props: OrbitalAnimationProps) {
    this.setupAnimation(props);
  }

  private setupAnimation({ svg, nodes, width, height, rotationSpeed = 0.00008, updateLinksInRealTime = false }: OrbitalAnimationProps) {
    // Cancel any existing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Skip animation if no nodes
    if (!nodes.length) return;

    // Find central node
    const centralNode = nodes.find(node => node.type === 'central');
    if (!centralNode) return;

    // Get node elements
    const nodeElements = svg.selectAll('g.node');
    const nodeGlowElements = svg.selectAll('circle.node-glow');
    const flowGlowElements = svg.selectAll('circle.flow-glow');

    // Get link elements if we need to update them
    const linkElements = updateLinksInRealTime ? svg.selectAll('path.link-path') : null;

    // Animation function
    const animate = () => {
      // Update non-central nodes
      nodes.forEach(node => {
        if (node.type === 'central') return;

        // Calculate current angle and distance from center
        const dx = node.x - centralNode.x;
        const dy = node.y - centralNode.y;
        const angle = Math.atan2(dy, dx) + rotationSpeed;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Update node position with rotation
        node.x = centralNode.x + Math.cos(angle) * distance;
        node.y = centralNode.y + Math.sin(angle) * distance;
      });

      // Update node positions
      nodeElements.data(nodes)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

      // Update glow positions
      nodeGlowElements.data(nodes)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      // Update flow glow positions
      flowGlowElements.data(nodes.filter(d => d.flowValue !== 0 && d.flowValue !== undefined))
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      // Update link positions if needed
      if (updateLinksInRealTime && linkElements) {
        linkElements.attr('d', (d: any) => {
          const source = nodes.find(n => n.id === d.source.id);
          const target = nodes.find(n => n.id === d.target.id);
          if (!source || !target) return '';

          // Create curved path
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2;

          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        });
      }

      // Continue animation
      this.animationId = requestAnimationFrame(animate);
    };

    // Start animation
    this.animationId = requestAnimationFrame(animate);
  }

  public cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Component wrapper for React
export const OrbitalAnimationComponent = React.memo((props: OrbitalAnimationProps) => {
  const animationRef = useRef<OrbitalAnimation | null>(null);

  useEffect(() => {
    animationRef.current = new OrbitalAnimation(props);

    return () => {
      animationRef.current?.cleanup();
    };
  }, [props]);

  return null;
});
