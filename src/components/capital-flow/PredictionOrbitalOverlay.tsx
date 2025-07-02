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
  zoomLevel,
}) => {
  useEffect(() => {
    if (!svg || !nodes || !predictions.length) return;

    // Remove previous overlays
    svg.selectAll('.prediction-pulse-group').remove();

    // Map predictions
    const predictionMap = new Map(predictions.map(p => [p.symbol.toUpperCase(), p]));

    const group = svg.append('g')
      .attr('class', 'prediction-pulse-group');

    nodes.forEach(node => {
      const prediction = predictionMap.get(node.id.toUpperCase());
      if (!prediction) return;

      group.append('circle')
        .attr('class', 'prediction-pulse')
        .attr('cx', node.x)
        .attr('cy', node.y)
        .attr('r', node.radius * 1.6 * (zoomLevel / 100))
        .attr('fill', 'none')
        .attr('stroke', prediction.bullish ? '#00ffcc' : '#ff0066')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7)
        .style('pointer-events', 'none')
        .style('animation', 'flow-pulse 2s ease-in-out infinite');
    });

  }, [svg, nodes, predictions, zoomLevel]);

  return null;
};
