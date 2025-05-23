import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { OrbitalNode } from './NodePlacement';

interface Props {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  predictions: Prediction[];
  chartTimeframe?: string;
}

const PredictionOrbitalOverlay: React.FC<Props> = ({
  svg,
  nodes,
  predictions,
  chartTimeframe = '4h'
}) => {
  useEffect(() => {
    if (!svg || predictions.length === 0 || nodes.length === 0) return;

    // Remove all previous pulse rings
    svg.selectAll('.prediction-pulse').remove();

    // Apply rings directly to node-group
    const overlayed = new Set();

    predictions.forEach(pred => {
      const node = nodes.find(n => n.id === pred.symbol);
      if (!node || pred.confidence < 0.6 || overlayed.has(node.id)) return;
      overlayed.add(node.id);

      const color = pred.bullish
        ? `rgba(0,255,128,${pred.confidence * 0.7})`
        : `rgba(255,50,50,${pred.confidence * 0.7})`;

      // Append pulse circle inside node-group
      svg.selectAll<SVGGElement, any>('.node-group')
        .filter((d: any) => d.id === node.id)
        .append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', node.radius * 1.6)
        .attr('stroke', color)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('pointer-events', 'none')
        .attr('opacity', 0.7)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.4};${node.radius * 1.9};${node.radius * 1.4}`)
        .attr('dur', pred.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      svg.selectAll('.node-group')
        .filter((d: any) => d.id === node.id)
        .select('.prediction-pulse')
        .append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.2;0.7')
        .attr('dur', pred.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });
  }, [svg, nodes, predictions, chartTimeframe]);

  return null;
};

export default PredictionOrbitalOverlay;
