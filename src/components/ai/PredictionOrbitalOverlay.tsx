import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  predictions = [],
  chartTimeframe = '4h',
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  useEffect(() => {
    if (!svg || predictions.length === 0) return;

    const nodeMap = new Map<string, Prediction>();
    predictions.forEach(pred => nodeMap.set(pred.symbol, pred));

    svg.selectAll('.node-glow').attr('fill', (d: any) => {
      const pred = nodeMap.get(d.id);
      if (!pred) return 'rgba(0, 187, 255, 0.3)';
      return pred.bullish
        ? 'rgba(0, 255, 136, 0.4)'
        : 'rgba(255, 51, 51, 0.4)';
    });

  }, [svg, predictions]);

  // Strategy Modal logic...
  const showStrategyModal = (symbol: string, prediction: Prediction) => {
    const currentPrice = parseFloat(prediction.price || "0");
    const stopLossPercent = 3 + Math.random() * 2;
    const takeProfitPercent1 = 5 + Math.random() * 5;
    const takeProfitPercent2 = takeProfitPercent1 + 5 + Math.random() * 10;

    const stopLoss = currentPrice * (prediction.bullish ? (1 - stopLossPercent / 100) : (1 + stopLossPercent / 100));
    const takeProfit1 = currentPrice * (prediction.bullish ? (1 + takeProfitPercent1 / 100) : (1 - takeProfitPercent1 / 100));
    const takeProfit2 = currentPrice * (prediction.bullish ? (1 + takeProfitPercent2 / 100) : (1 - takeProfitPercent2 / 100));

    setSelectedStrategy({
      symbol,
      name: prediction.name || symbol,
      entry: currentPrice.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit1: takeProfit1.toFixed(2),
      takeProfit2: takeProfit2.toFixed(2),
      risk: `${stopLossPercent.toFixed(1)}%`,
      reward: `${takeProfitPercent2.toFixed(1)}%`,
      timeframe: chartTimeframe,
      direction: prediction.bullish ? 'bullish' : 'bearish',
      overview: `Based on ${prediction.factors.join(", ")}, ${symbol} is showing ${prediction.bullish ? 'bullish' : 'bearish'} signals.`
    });
  };

  return (
    <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={selectedStrategy ? getCryptoLogoUrl(selectedStrategy.symbol) : ''} className="w-6 h-6 rounded-full" />
            {selectedStrategy?.name} ({selectedStrategy?.symbol}) Strategy
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Trading strategy for {selectedStrategy?.timeframe}
          </DialogDescription>
        </DialogHeader>
        {selectedStrategy && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm leading-relaxed text-gray-300">{selectedStrategy.overview}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PredictionOrbitalOverlay;
