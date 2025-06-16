// ⚙️ IMPORTS
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

// 🎯 UTILS
const getGlowColor = (node: OrbitalNode): string => {
  if (node.divergenceBullish) return 'rgba(0,255,255,0.4)'; // Cyan
  if (node.divergenceBearish) return 'rgba(255,0,180,0.4)';  // Pink-red
  if (node.inflow > node.outflow) return 'rgba(0, 255, 204, 0.3)'; // inflow
  if (node.outflow > node.inflow) return 'rgba(255, 0, 102, 0.3)'; // outflow
  return 'rgba(0, 181, 216, 0.3)';
};

const getStrokeColor = (node: OrbitalNode, selectedNodeId: string | null): string => {
  if (selectedNodeId === node.id) return '#ffffff';
  if (node.divergenceBullish) return '#00ffff';
  if (node.divergenceBearish) return '#ff0077';
  if (node.inflow > node.outflow) return '#00ffcc';
  if (node.outflow > node.inflow) return '#ff0066';
  return '#00b5d8';
};

// 📦 CLASS
export class NodeRenderer {
  constructor(props: NodeRendererProps) {
    this.renderNodes(props);
  }

  private renderNodes({ svg, nodes, centralNode, selectedNodeId, zoomLevel }: NodeRendererProps) {
    svg.selectAll('.nodes-group').remove();
    const nodesGroup = svg.append("g").attr("class", "nodes-group");

    this.createNodePatterns(svg, nodes);

    // 🟢 GLOW
    nodesGroup.selectAll('circle.node-glow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * 1.6 * volFactor * (zoomLevel / 100);
      })
      .attr('fill', getGlowColor)
      .attr('filter', 'blur(8px)');

    // 🧠 MAIN NODE
    const node = nodesGroup.selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .on('mouseenter.node', (event, d) => {
        // Remove any existing tooltips first
        svg.selectAll('.node-tooltip').remove();
        d3.select('.prediction-tooltip').remove();
        
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
          .attr('stroke', getStrokeColor(d, selectedNodeId))
          .attr('stroke-width', 1);

        tooltip.append('text')
          .attr('x', 0)
          .attr('y', -20)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .text(d.name || d.id);

        tooltip.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .text(`Volume: ${d.volume?.toLocaleString() || 'N/A'}`);
      })
      .on('mouseleave.node', () => {
        svg.selectAll('.node-tooltip').remove();
      })
      .on('click', (event, d) => {
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId: d.id } });
        document.dispatchEvent(clickEvent);
      });

    // 🔵 CIRCLE
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => {
        const volFactor = d.volume ? Math.sqrt(d.volume) / 100 : 1;
        return d.radius * volFactor * (zoomLevel / 100);
      })
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => getStrokeColor(d, selectedNodeId))
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9);

    // 🔤 LABEL
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (zoomLevel / 100) + 15)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, Math.min(14, d.radius * 0.4) * (zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .text(d => d.id);
  }

  private createNodePatterns(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: OrbitalNode[]) {
    svg.select('defs').remove();
    const defs = svg.append('defs');
    nodes.forEach(node => {
      const pattern = defs.append('pattern')
        .attr('id', `logo-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      const logoUrl = getCryptoLogoUrl(node.id);
      pattern.append('image')
        .attr('href', logoUrl)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          d3.select(this).attr('href', getFallbackLogoUrl());
        });
    });
  }
}

// 🔁 REACT WRAPPER
export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    new NodeRenderer(props);
    return () => {
      props.svg.selectAll('.nodes-group').remove();
      props.svg.selectAll('.node-tooltip').remove();
    };
  }, [props]);

  return null;
});
