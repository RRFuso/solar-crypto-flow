
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { OrbitalNode } from './NodePlacement';

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
    if (!svg || predictions.length === 0 || nodes.length === 0) return;

    const overlayGroup = svg.select('g.prediction-overlay');
    if (!overlayGroup.empty()) {
      overlayGroup.remove();
    }

    const group = svg.append('g').attr('class', 'prediction-overlay');

    const predictionMap = new Map(predictions.map(p => [p.symbol.toUpperCase(), p]));

    nodes.forEach((node) => {
      const prediction = predictionMap.get(node.id.toUpperCase());
      if (!prediction || prediction.confidence < 0.6) return;

      const ring = group.append('circle')
        .attr('class', 'prediction-ring')
        .attr('cx', node.x)
        .attr('cy', node.y)
        .attr('r', node.radius * 1.5 * (zoomLevel / 100))
        .attr('fill', 'none')
        .attr('stroke', prediction.bullish ? '#00ffcc' : '#ff0066')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6);

      ring.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.6};${node.radius * 1.2}`)
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite');

      ring.append('animate')
        .attr('attributeName', 'stroke-opacity')
        .attr('values', '0.6;0.2;0.6')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite');
    });
  }, [svg, nodes, predictions, zoomLevel]);

  return null;
};
