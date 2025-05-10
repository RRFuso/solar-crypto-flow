import * as d3 from 'd3';
import React, { useEffect } from 'react';

interface NodeData {
  id: string;
  name: string;
  symbol: string;
  totalValue: number;
  inflow: number;
  outflow: number;
  x: number;
  y: number;
  radius: number;
}

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NodeData[];
  centralNode: NodeData;
  selectedNodeId?: string;
}

export const NodeRendererComponent: React.FC<NodeRendererProps> = ({
  svg,
  nodes,
  centralNode,
  selectedNodeId,
}) => {
  useEffect(() => {
    if (!svg) return;

    d3.select('body').select('.tooltip').remove();

    const tooltip = d3.select('body')
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
    if (defs.empty()) defs = svg.append('defs');

    const setGlowFilter = (id: string, color: string) => {
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
        filter.select('feDropShadow').attr('flood-color', color);
      }
    };

    setGlowFilter('glow-green', 'lime');
    setGlowFilter('glow-red', 'red');
    setGlowFilter('glow-blue', 'deepskyblue');

    const centralGroup = svg.selectAll<SVGGElement, NodeData>('.central-group')
      .data([centralNode]);

    const centralGroupEnter = centralGroup.enter()
      .append('g')
      .attr('class', 'central-group')
      .attr('transform', `translate(${centralNode.x},${centralNode.y})`);

    centralGroupEnter.append('circle')
      .attr('r', 15)
      .attr('fill', 'gold')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    centralGroupEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#fff')
      .style('font-size', '14px')
      .text(centralNode.symbol);

    centralGroup.exit().remove();

    const nodeGroups = svg.selectAll<SVGGElement, NodeData>('.node-group')
      .data(nodes, (d: any) => d.id);

    const nodeGroupEnter = nodeGroups.enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('data-id', d => d.id)
      .attr('transform', d => `translate(${d.x},${d.y})`) // ✅ Importante
      .on('mouseover', (event, d) => {
        const flowColor = d.inflow > d.outflow ? 'Verde'
          : d.outflow > d.inflow ? 'Vermelho' : 'Azul';
        tooltip.html(`
          <strong>${d.name} (${d.symbol})</strong><br/>
          Valor Total: ${d.totalValue}<br/>
          Inflow: ${d.inflow}<br/>
          Outflow: ${d.outflow}<br/>
          Cor de Fluxo: ${flowColor}
        `)
          .style('display', 'block');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      });

    nodeGroupEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius || 10)
      .attr('fill', '#fff')
      .attr('filter', d => {
        if (d.inflow > d.outflow) return 'url(#glow-green)';
        if (d.outflow > d.inflow) return 'url(#glow-red)';
        return 'url(#glow-blue)';
      });

    nodeGroupEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 25)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .text(d => d.symbol);

    nodeGroups.exit().remove();
  }, [svg, nodes, centralNode, selectedNodeId]);

  return null;
};
