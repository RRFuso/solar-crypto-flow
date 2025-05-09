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

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({
  svg,
  nodes,
  updateInterval = 600000,
  predictions = [],
  chartTimeframe = '4h'
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  useEffect(() => {
    if (!svg || predictions.length === 0 || !nodes) return;

    svg.selectAll('.prediction-pulse').remove();

    const overlayGroup = svg.append('g').attr('class', 'prediction-pulse-group');

    predictions.forEach(pred => {
      const node = nodes.find(n => n.id === pred.symbol);
      if (!node || pred.confidence < 0.6) return;

      const color = pred.bullish
        ? `rgba(0, 255, 128, ${pred.confidence * 0.7})`
        : `rgba(255, 50, 50, ${pred.confidence * 0.7})`;

      const pulse = overlayGroup.append("circle")
        .attr("class", "prediction-pulse")
        .attr("r", node.radius * 1.2)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("opacity", 0.7)
        .attr("pointer-events", "none");

      // Add animations
      pulse.append("animate")
        .attr("attributeName", "r")
        .attr("values", `${node.radius * 1.2};${node.radius * 1.8};${node.radius * 1.2}`)
        .attr("dur", pred.bullish ? "3s" : "4s")
        .attr("repeatCount", "indefinite");

      pulse.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.7;0.3;0.7")
        .attr("dur", pred.bullish ? "3s" : "4s")
        .attr("repeatCount", "indefinite");

      // Store for update
      (pulse as any).__cryptoId = pred.symbol;
    });

    function updatePulsePositions() {
      svg.selectAll('.prediction-pulse').each(function () {
        const pulse = d3.select(this);
        const symbol = (pulse as any).__cryptoId;
        const node = nodes.find(n => n.id === symbol);
        if (node) {
          pulse.attr("cx", node.x).attr("cy", node.y);
        }
      });

      requestAnimationFrame(updatePulsePositions);
    }

    requestAnimationFrame(updatePulsePositions);

    return () => {
      svg.selectAll('.prediction-pulse-group').remove();
    };
  }, [svg, predictions, nodes]);

  const showStrategyModal = (symbol: string, prediction: Prediction) => {
    const currentPrice = parseFloat(prediction.price || "0");
    const stopLossPercent = 3 + Math.random() * 2;
    const takeProfitPercent1 = 5 + Math.random() * 5;
    const takeProfitPercent2 = takeProfitPercent1 + 5 + Math.random() * 10;

    const stopLoss = prediction.bullish
      ? currentPrice * (1 - stopLossPercent / 100)
      : currentPrice * (1 + stopLossPercent / 100);
    const takeProfit1 = prediction.bullish
      ? currentPrice * (1 + takeProfitPercent1 / 100)
      : currentPrice * (1 - takeProfitPercent1 / 100);
    const takeProfit2 = prediction.bullish
      ? currentPrice * (1 + takeProfitPercent2 / 100)
      : currentPrice * (1 - takeProfitPercent2 / 100);

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
      overview: `Based on ${prediction.factors.join(", ")}, ${symbol} is showing ${prediction.bullish ? 'strong bullish' : 'bearish'} potential in the ${chartTimeframe} timeframe. Entry around ${currentPrice.toFixed(2)} with a ${stopLossPercent.toFixed(1)}% stop loss and targets at ${takeProfitPercent1.toFixed(1)}% and ${takeProfitPercent2.toFixed(1)}%.`
    });
  };

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
        {selectedStrategy && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm leading-relaxed text-gray-300">{selectedStrategy.overview}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg flex flex-col ${selectedStrategy.direction === 'bullish' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                <span className="text-xs text-gray-400">Direction</span>
                <span className={`text-lg font-bold ${selectedStrategy.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStrategy.direction === 'bullish' ? '🚀 Long' : '🔻 Short'}
                </span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg flex flex-col">
                <span className="text-xs text-gray-400">Entry Price</span>
                <span className="text-lg font-bold">${selectedStrategy.entry}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-red-900/20 rounded-lg flex flex-col">
                <span className="text-xs text-gray-400">Stop Loss</span>
                <span className="text-lg font-bold text-red-400">${selectedStrategy.stopLoss}</span>
                <span className="text-xs text-red-500/70">Risk: {selectedStrategy.risk}</span>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg flex flex-col">
                <span className="text-xs text-gray-400">Take Profit 1</span>
                <span className="text-lg font-bold text-green-400">${selectedStrategy.takeProfit1}</span>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg flex flex-col">
                <span className="text-xs text-gray-400">Take Profit 2</span>
                <span className="text-lg font-bold text-green-400">${selectedStrategy.takeProfit2}</span>
                <span className="text-xs text-green-500/70">Reward: {selectedStrategy.reward}</span>
              </div>
            </div>
            <div className="pt-2 text-center text-xs text-gray-500">
              This is a simulated trading strategy for educational purposes only. Not financial advice.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PredictionOrbitalOverlay;

