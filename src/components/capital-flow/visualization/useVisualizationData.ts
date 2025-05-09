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

interface StrategyData {
  symbol: string;
  name: string;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  risk: string;
  reward: string;
  timeframe: string;
  direction: 'bullish' | 'bearish';
  overview: string;
}

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
  chartTimeframe = '4h',
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  // Normaliza símbolo para remover USDT/USD
  const normalizeSymbol = (symbol: string) =>
    symbol.replace(/[-_]?USDT$/i, '').replace(/[-_]?USD$/i, '');

  useEffect(() => {
    if (!svg || predictions.length === 0 || nodes.length === 0) return;

    // Limpa previsões anteriores
    svg.selectAll('.prediction-pulse').remove();

    const overlayGroup = svg.append('g').attr('class', 'prediction-overlay');

    const predictionMap = new Map<string, Prediction>();
    predictions.forEach((p) => {
      predictionMap.set(normalizeSymbol(p.symbol), p);
    });

    nodes.forEach((node: any) => {
      const cleanId = normalizeSymbol(node.id);
      const prediction = predictionMap.get(cleanId);

      if (!prediction || prediction.confidence < 0.6) return;

      const color = prediction.bullish
        ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})`
        : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;

      const pulse = overlayGroup
        .append('circle')
        .attr('class', 'prediction-pulse')
        .datum(node) // Vincula o nó ao círculo
        .attr('r', node.radius * 1.2)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8)
        .attr('pointer-events', 'none');

      // Animações SVG
      pulse.append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');

      pulse.append('animate')
        .attr('attributeName', 'opacity')
        .attr('values', '0.8;0.2;0.8')
        .attr('dur', prediction.bullish ? '3s' : '4s')
        .attr('repeatCount', 'indefinite');
    });

    // Atualização contínua da posição dos aneis conforme os nós orbitam
    const updatePositions = () => {
      svg.selectAll<SVGCircleElement, any>('circle.prediction-pulse')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
      requestAnimationFrame(updatePositions);
    };
    updatePositions();

    return () => {
      svg.selectAll('.prediction-pulse').remove();
    };
  }, [svg, predictions, nodes]);

  return null;
};

export default PredictionOrbitalOverlay;
