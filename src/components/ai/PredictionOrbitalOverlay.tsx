import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { Prediction } from '@/lib/aiModel';

interface Props {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  predictions: Prediction[];
  zoomLevel: number;
}

export const PredictionOrbitalOverlay: React.FC<Props> = ({
  svg,
  nodes,
  predictions,
  zoomLevel
}) => {
  useEffect(() => {
    if (!svg || !predictions.length || !nodes.length) return;

    svg.selectAll('.prediction-ring-group').remove();

    const ringGroup = svg.append('g').attr('class', 'prediction-ring-group');

    const map = new Map(predictions.map(p => [p.symbol.toUpperCase(), p]));

    nodes.forEach(node => {
      const p = map.get(node.id.toUpperCase());
      if (!p) return;

      const group = ringGroup.append('g')
        .attr('transform', `translate(${node.x},${node.y})`)
        .attr('class', 'prediction-ring');

      group.append('circle')
        .attr('r', node.radius * 1.45 * (zoomLevel / 100))
        .attr('fill', 'none')
        .attr('stroke', p.bullish ? '#00ffcc' : '#ff0066')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .attr('class', 'animate-pulse');
    });
  }, [svg, nodes, predictions, zoomLevel]);

  return null;
};
