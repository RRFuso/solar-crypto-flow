import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel'; 
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  updateInterval?: number;
  predictions?: Prediction[];
  chartTimeframe?: string;
}

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  updateInterval = 600000,
  predictions = [],
  chartTimeframe = '4h'
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;

    const newMap = new Map<string, Prediction>();
    predictions.forEach(p => newMap.set(p.symbol, p));
    setPredictionMap(newMap);
  }, [predictions]);

  useEffect(() => {
    if (!svg || !predictionMap || predictionMap.size === 0 || !nodes) return;

    svg.selectAll('.prediction-pulse').remove();

    const pulseGroup = svg.append('g').attr('class', 'prediction-pulse-group');

    nodes.forEach(node => {
      const prediction = predictionMap.get(node.id);
      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0,255,128,${prediction.confidence * 0.7})`
        : `rgba(255,50,50,${prediction.confidence * 0.7})`;

      const pulse = pulseGroup.append('circle')
        .datum(node) // bind node data to update it in animation
        .attr('class', 'prediction-pulse')
        .attr('r', node.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', `0.7;0.3;0.7`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    const updatePositions = () => {
      svg.selectAll('.prediction-pulse')
        .attr('cx', function (d: any) { return d.x; })
        .attr('cy', function (d: any) { return d.y; });

      requestAnimationFrame(updatePositions);
    };

    updatePositions();

    return () => {
      svg.selectAll('.prediction-pulse').remove();
    };
  }, [svg, predictionMap, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
