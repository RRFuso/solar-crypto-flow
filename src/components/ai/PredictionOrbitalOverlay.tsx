import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  predictions: Prediction[];
  chartTimeframe?: string;
}

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions,
  chartTimeframe = '4h'
}) => {
  useEffect(() => {
    if (!svg || predictions.length === 0 || nodes.length === 0) return;

    // Remove old rings from previous render
    svg.selectAll('.prediction-ring').remove();

    // Add new rings inside node-group
    predictions.forEach(prediction => {
      if (prediction.confidence < 0.6) return;
      const node = nodes.find(n => n.id === prediction.symbol);
      if (!node) return;

      const group = svg.select(`.node-group[data-id="${prediction.symbol}"]`);
      if (group.empty()) return;

      const pulse = group.append('circle')
        .attr('class', 'prediction-ring')
        .attr('r', node.radius * 1.8)
        .attr('fill', 'none')
        .attr('stroke', prediction.bullish ? '#00ff88' : '#ff4466')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.5};${node.radius * 2.2};${node.radius * 1.5}`)
        .attr('dur', prediction.bullish ? '2.5s' : '3.2s')
        .attr('repeatCount', 'indefinite');

      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.3;0.7')
        .attr('dur', prediction.bullish ? '2.5s' : '3.2s')
        .attr('repeatCount', 'indefinite');
    });
  }, [svg, predictions, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
