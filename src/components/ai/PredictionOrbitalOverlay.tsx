
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

interface PredictionHistory {
  [key: string]: {
    timestamp: number;
    bullish: boolean;
    confidence: number;
    factors: string[];
  }[];
}

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
  chartTimeframe = '4h'
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory>({});

  useEffect(() => {
    if (!predictions || predictions.length === 0) return;

    const newMap = new Map<string, Prediction>();
    predictions.forEach(p => newMap.set(p.symbol, p));
    setPredictionMap(newMap);

    const newHistory = { ...predictionHistory };
    predictions.forEach(p => {
      const history = newHistory[p.symbol] || [];
      const last = history[0];
      const isDifferent = !last || last.bullish !== p.bullish || Math.abs(last.confidence - p.confidence) > 0.1;
      const isOld = !last || (Date.now() - last.timestamp > 15 * 60 * 1000);

      if (isDifferent || isOld) {
        history.unshift({
          timestamp: Date.now(),
          bullish: p.bullish,
          confidence: p.confidence,
          factors: p.factors
        });
        newHistory[p.symbol] = history.slice(0, 5);
      }
    });

    setPredictionHistory(newHistory);
  }, [predictions]);

  useEffect(() => {
    if (!svg || predictionMap.size === 0) return;

    svg.selectAll('.prediction-pulse-group').remove();

    const group = svg.append('g').attr('class', 'prediction-pulse-group');

    const pulses = group
      .selectAll('g.pulse-node')
      .data(nodes.filter(n => predictionMap.has(n.id)))
      .enter()
      .append('g')
      .attr('class', 'pulse-node')
      .attr('data-id', d => d.id);

    pulses.each(function (d) {
      const prediction = predictionMap.get(d.id);
      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
        : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

      d3.select(this)
        .append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', d.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none')
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${d.radius * 1.2};${d.radius * 1.8};${d.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      d3.select(this)
        .select('circle')
        .append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.3;0.7')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    const animate = () => {
      group.selectAll('g.pulse-node').each(function (d: any) {
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
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
