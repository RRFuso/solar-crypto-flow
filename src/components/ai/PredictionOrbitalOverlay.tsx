import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  predictions: Prediction[];
}

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions
}) => {
  useEffect(() => {
    if (!svg || predictions.length === 0 || nodes.length === 0) return;

    // Remove existing pulse circles
    svg.selectAll('.prediction-pulse').remove();

    // Create pulse group
    const overlayGroup = svg.select('g.prediction-overlay') || svg.append('g').attr('class', 'prediction-overlay');

    predictions.forEach((prediction) => {
      const node = nodes.find(n => n.id === prediction.symbol);
      if (!node || prediction.confidence < 0.6) return;

      const color = prediction.bullish 
        ? `rgba(0,255,128,${prediction.confidence * 0.7})` 
        : `rgba(255,50,50,${prediction.confidence * 0.7})`;

      const pulse = overlayGroup.append('circle')
        .attr('class', 'prediction-pulse')
        .attr('data-id', node.id)
        .attr('r', node.radius * 1.8)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.3;0.7')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });
  }, [svg, predictions, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
