
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  predictions?: Prediction[];
  chartTimeframe?: string;
}

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;
    const map = new Map<string, Prediction>();
    predictions.forEach(p => map.set(p.symbol, p));
    setPredictionMap(map);
  }, [predictions]);

  useEffect(() => {
    if (!svg || predictionMap.size === 0) return;

    svg.selectAll('.prediction-pulse-group').remove();

    const pulseLayer = svg.append('g').attr('class', 'prediction-pulse-group');

    // Inicializar grupos de pulso com base nas previsões
    nodes.forEach(node => {
      const prediction = predictionMap.get(node.id);
      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
        : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

      const group = pulseLayer.append('g')
        .attr('class', 'prediction-pulse')
        .attr('data-id', node.id); // referenciado por id para atualização

      const circle = group.append('circle')
        .attr('r', node.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      circle.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      circle.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.2;0.7')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    // Loop de animação para atualizar posição dos grupos
    const animate = () => {
      pulseLayer.selectAll<SVGGElement, unknown>('.prediction-pulse')
        .each(function () {
          const group = d3.select(this);
          const id = group.attr('data-id');
          const node = nodes.find(n => n.id === id);
          if (node) {
            group.attr('transform', `translate(${node.x}, ${node.y})`);
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
