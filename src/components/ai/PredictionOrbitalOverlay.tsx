import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

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
  chartTimeframe = '4h',
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;
    const map = new Map<string, Prediction>();
    predictions.forEach((p) => map.set(p.symbol, p));
    setPredictionMap(map);
  }, [predictions]);

  useEffect(() => {
    if (!svg || predictionMap.size === 0) return;

    svg.selectAll('.prediction-pulse-group').remove();

    const pulseGroup = svg.append('g').attr('class', 'prediction-pulse-group');

    const pulseMap = new Map<string, d3.Selection<SVGCircleElement, unknown, null, undefined>>();

    // Criar os círculos de pulso uma vez
    nodes.forEach((node) => {
      const prediction = predictionMap.get(node.id);
      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
        : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

      const pulse = pulseGroup
        .append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', node.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      // SVG-based animation
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

      pulseMap.set(node.id, pulse);
    });

    // Atualizar a posição de cada pulse sincronizada com os nós orbitais
    const animate = () => {
      pulseMap.forEach((circle, id) => {
        const updatedNode = nodes.find((n) => n.id === id);
        if (updatedNode) {
          circle
            .attr('cx', updatedNode.x)
            .attr('cy', updatedNode.y);
        }
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      svg.selectAll('.prediction-pulse-group').remove();
    };
  }, [svg, predictionMap, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
