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

export const NodeRendererComponent: React.FC<NodeRendererProps> = ({
  svg,
  nodes,
  centralNode,
  selectedNodeId,
  zoomLevel,
}) => {
  useEffect(() => {
    if (!svg || !nodes.length) return;

    svg.selectAll('.nodes-group').remove();
    svg.selectAll('.node-tooltip').remove();

    const defs = svg.select('defs').empty()
      ? svg.append('defs')
      : svg.select('defs');

    // Criar patterns para logos
    defs.selectAll('pattern').remove();
    nodes.forEach(node => {
      const logoUrl = getCryptoLogoUrl(node.id);
      defs.append('pattern')
        .attr('id', `logo-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox')
        .append('image')
        .attr('href', logoUrl)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .on('error', function () {
          d3.select(this).attr('href', getFallbackLogoUrl());
        });
    });

    const nodesGroup = svg.append('g').attr('class', 'nodes-group');

    // Glows
    nodesGroup.selectAll('.node-glow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node-glow')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 1.6 * (zoomLevel / 100))
      .attr('fill', d => {
        if (d.type === 'central') return 'rgba(247, 147, 26, 0.3)';
        if (d.inflow > d.outflow) return 'rgba(0, 255, 204, 0.3)';
        if (d.outflow > d.inflow) return 'rgba(255, 0, 102, 0.3)';
        return 'rgba(0, 181, 216, 0.3)';
      })
      .attr('filter', 'blur(8px)');

    // Grupos principais de nós
    const node = nodesGroup.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node node-group')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('data-id', d => d.id)
      .on('mouseenter', (event, d) => {
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

        d3.select(event.currentTarget)
          .select('circle.node-circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 3);
      })
      .on('mouseleave', (event, d) => {
        svg.selectAll('.node-tooltip').remove();
        if (selectedNodeId !== d.id) {
          d3.select(event.currentTarget)
            .select('circle.node-circle')
            .transition()
            .duration(200)
            .attr('stroke-width', 2);
        }
      })
      .on('click', (event, d) => {
        const clickEvent = new CustomEvent('node-click', {
          detail: { nodeId: d.id }
        });
        document.dispatchEvent(clickEvent);
      });

    // Círculo principal (com logo)
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius * (zoomLevel / 100))
      .attr('fill', d => `url(#logo-${d.id})`)
      .attr('stroke', d => {
        if (selectedNodeId === d.id) return '#ffffff';
        if (d.type === 'central') return '#F7931A';
        if (d.inflow > d.outflow) return '#00ffcc';
        if (d.outflow > d.inflow) return '#ff0066';
        return '#00b5d8';
      })
      .attr('stroke-width', d => selectedNodeId === d.id ? 3 : 2)
      .attr('stroke-opacity', 0.9);

    // Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius * (zoomLevel / 100) + 15)
      .attr('fill', 'white')
      .attr('font-size', d => Math.max(10, Math.min(14, d.radius * 0.4) * (zoomLevel / 100)))
      .attr('font-weight', 'bold')
      .text(d => d.id);
  }, [svg, nodes, centralNode, selectedNodeId, zoomLevel]);

  return null;
};
