import * as d3 from 'd3';
import React, { useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';

interface NodeData {
  id: string;
  name: string;
  symbol: string;
  totalValue: number;
  inflow: number;
  outflow: number;
  radius?: number;
}

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NodeData[];
  centralNode: NodeData;
  selectedNodeId?: string;
  predictions?: Prediction[];
}

export const NodeRendererComponent: React.FC<NodeRendererProps> = ({
  svg,
  nodes,
  centralNode,
  selectedNodeId,
  predictions = [],
}) => {
  useEffect(() => {
    if (!svg) return;

    const tooltip = d3.select('body').select('.tooltip');
    if (!tooltip.empty()) tooltip.remove();

    const newTooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('display', 'none');

    let defs = svg.select('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }

    function setGlowFilter(id: string, color: string) {
      let filter = defs.select(`#${id}`);
      if (filter.empty()) {
        filter = defs.append('filter')
          .attr('id', id)
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
        filter.append('feDropShadow')
          .attr('dx', 0)
          .attr('dy', 0)
          .attr('stdDeviation', 5)
          .attr('flood-color', color)
          .attr('flood-opacity', 0.8);
      } else {
        filter.select('feDropShadow')
          .attr('flood-color', color);
      }
    }

    setGlowFilter('glow-green', 'lime');
    setGlowFilter('glow-red', 'red');
    setGlowFilter('glow-blue', 'deepskyblue');

    // Render central node
    const centralGroup = svg.selectAll<SVGGElement, NodeData>('.central-group')
      .data([centralNode]);

    const centralGroupEnter = centralGroup.enter()
      .append('g')
      .attr('class', 'central-group');

    centralGroupEnter.append('circle')
      .attr('r', 15)
      .attr('fill', 'gold')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cx', 0)
      .attr('cy', 0);

    centralGroupEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#fff')
      .style('font-size', '14px')
      .text(centralNode.symbol);

    centralGroup.exit().remove();

    // Render orbiting nodes
    const nodeGroups = svg.selectAll<SVGGElement, NodeData>('.node-group')
      .data(nodes, (d: any) => d.id);

    const nodeGroupEnter = nodeGroups.enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('data-id', d => d.id)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .on('mouseover', (event, d) => {
        const flowColor = d.inflow > d.outflow ? 'Verde'
          : d.outflow > d.inflow ? 'Vermelho' : 'Azul';
        newTooltip.html(`
          <strong>${d.name} (${d.symbol})</strong><br/>
          Valor Total: ${d.totalValue}<br/>
          Inflow: ${d.inflow}<br/>
          Outflow: ${d.outflow}<br/>
          Cor de Fluxo: ${flowColor}
        `)
          .style('display', 'block');
      })
      .on('mousemove', (event) => {
        newTooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseout', () => {
        newTooltip.style('display', 'none');
      });

    // Base circle
    nodeGroupEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', 10)
      .attr('fill', '#fff')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('filter', d => {
        if (d.inflow > d.outflow) return 'url(#glow-green)';
        if (d.outflow > d.inflow) return 'url(#glow-red)';
        return 'url(#glow-blue)';
      });

    // Text label
    nodeGroupEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .text(d => d.symbol);

    // ⬅️ Prediction Ring (anéis) – renderizados dentro da .node-group
    nodeGroupEnter.each(function (d: NodeData) {
      const group = d3.select(this);
      const prediction = predictions.find(p => p.symbol === d.id && p.confidence >= 0.6);
      if (!prediction) return;

      const color = prediction.bullish
        ? `rgba(0,255,128,${prediction.confidence * 0.7})`
        : `rgba(255,50,50,${prediction.confidence * 0.7})`;

      const pulse = group.append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', (d.radius || 10) * 1.8)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${(d.radius || 10) * 1.2};${(d.radius || 10) * 1.8};${(d.radius || 10) * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.3;0.7')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    nodeGroups.exit().remove();
  }, [svg, nodes, centralNode, selectedNodeId, predictions]);

  return null;
};
