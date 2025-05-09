import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
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

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
  chartTimeframe = '4h'
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  useEffect(() => {
    if (!svg || !nodes || predictions.length === 0) return;

    // Limpa anéis anteriores
    svg.selectAll('.prediction-pulse').remove();

    const group = svg.append('g').attr('class', 'prediction-pulse-group');

    predictions.forEach(pred => {
      const node = nodes.find(n => n.id === pred.symbol);
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') return;
      if (pred.confidence < 0.6) return;

      const color = pred.bullish
        ? `rgba(0, 255, 128, ${pred.confidence * 0.7})`
        : `rgba(255, 50, 50, ${pred.confidence * 0.7})`;

      // Anel fixo, que será reposicionado em cada frame
      const ring = group.append('circle')
        .attr('class', 'prediction-pulse')
        .attr('r', node.radius * 1.5)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('opacity', 0.6)
        .attr('pointer-events', 'none');

      // Identificador do nó para sync
      (ring as any).__cryptoId = pred.symbol;
    });

    // Atualiza posição dos anéis com o giro das criptos
    function updateRingPositions() {
      svg.selectAll('.prediction-pulse').each(function () {
        const ring = d3.select(this);
        const symbol = (ring as any).__cryptoId;
        const node = nodes.find(n => n.id === symbol);
        if (!node) return;
        ring.attr('cx', node.x).attr('cy', node.y);
      });

      requestAnimationFrame(updateRingPositions);
    }

    requestAnimationFrame(updateRingPositions);

    return () => {
      svg.selectAll('.prediction-pulse-group').remove();
    };
  }, [svg, nodes, predictions]);

  return (
    <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src={selectedStrategy ? getCryptoLogoUrl(selectedStrategy.symbol) : ''}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
              }}
            />
            {selectedStrategy?.name} ({selectedStrategy?.symbol}) Strategy
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Trading strategy for {selectedStrategy?.timeframe} timeframe
          </DialogDescription>
        </DialogHeader>
        {/* Resto do modal aqui, removido para foco no visual */}
      </DialogContent>
    </Dialog>
  );
};

export default PredictionOrbitalOverlay;
