
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { OrbitalNode } from './NodePlacement';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  predictions: Prediction[];
  zoomLevel: number;
}

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions,
  zoomLevel,
}) => {
  useEffect(() => {
    if (!svg || !predictions || predictions.length === 0) return;

    // Remove previous prediction rings
    svg.selectAll('.prediction-ring-group').remove();

    const ringGroup = svg.append('g').attr('class', 'prediction-ring-group');

    const predictionMap = new Map(predictions.map((p) => [p.symbol.toUpperCase(), p]));

    // Attach rings to node positions
    nodes.forEach((node) => {
      const prediction = predictionMap.get(node.id.toUpperCase());
      if (!prediction) return;

      const group = ringGroup.append('g')
        .attr('class', 'prediction-ring')
        .attr('transform', `translate(${node.x},${node.y})`);

      // Pulse animation ring
      group.append('circle')
        .attr('r', node.radius * 1.4 * (zoomLevel / 100))
        .attr('fill', 'none')
        .attr('stroke', prediction.bullish ? '#00ffcc' : '#ff0066')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .style('animation', 'flow-pulse 2s ease-in-out infinite');
    });
  }, [svg, nodes, predictions, zoomLevel]);

  return null;
};
