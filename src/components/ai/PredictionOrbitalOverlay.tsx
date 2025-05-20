// src/components/capital-flow/PredictionOrbitalOverlay.tsx

import { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  predictions: Prediction[];
}

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({ svg, predictions }) => {
  useEffect(() => {
    if (!svg || predictions.length === 0) return;

    // Remove old prediction circles
    svg.selectAll('.node-group .prediction-pulse').remove();

    predictions.forEach(pred => {
      if (pred.confidence < 0.6) return;

      const nodeGroup = svg.select(`.node-group[data-id='${pred.symbol}']`);
      if (nodeGroup.empty()) return;

      const color = pred.bullish
        ? `rgba(0,255,128,${pred.confidence * 0.7})`
        : `rgba(255,50,50,${pred.confidence * 0.7})`;

      const pulse = nodeGroup
        .append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', 14) // será adaptado conforme raio
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      pulse
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', `12;16;12`)
        .attr('dur', pred.bullish ? '2s' : '3s')
        .attr('repeatCount', 'indefinite');

      pulse
        .append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.3;0.7')
        .attr('dur', pred.bullish ? '2s' : '3s')
        .attr('repeatCount', 'indefinite');
    });
  }, [svg, predictions]);

  return null;
};

export default PredictionOrbitalOverlay;
