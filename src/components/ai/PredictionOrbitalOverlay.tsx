
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

const normalizeSymbol = (symbol: string) =>
  symbol.replace(/[-_]?USDT$/i, '').replace(/[-_]?USD$/i, '');

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
  chartTimeframe = '4h',
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());

  useEffect(() => {
    const map = new Map<string, Prediction>();
    predictions.forEach((p) => {
      const key = normalizeSymbol(p.symbol);
      map.set(key, p);
    });
    setPredictionMap(map);
  }, [predictions]);

  useEffect(() => {
    if (!svg || nodes.length === 0 || predictionMap.size === 0) return;

    // Remove previous
    svg.selectAll('.prediction-pulse').remove();

    // Create group
    const overlayGroup = svg.append('g').attr('class', 'prediction-overlay');

    nodes.forEach((node) => {
      const cleanId = normalizeSymbol(node.id);
      const prediction = predictionMap.get(cleanId);

      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
        : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

      const pulse = overlayGroup
        .append('circle')
        .attr('class', 'prediction-pulse')
        .datum(node)
        .attr('r', node.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('pointer-events', 'none');

      // Animate radius
      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      // Animate opacity
      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.7;0.2;0.7')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    // Sync position with orbital movement
    const syncPulsePositions = () => {
      svg.selectAll<SVGCircleElement, any>('circle.prediction-pulse')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);

      requestAnimationFrame(syncPulsePositions);
    };

    syncPulsePositions();

    return () => {
      svg.selectAll('.prediction-pulse').remove();
    };
  }, [svg, predictionMap, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
