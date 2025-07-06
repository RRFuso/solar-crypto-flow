import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { CryptoData } from '@/types/crypto';
import { fetchCryptoData, fetchCapitalFlows } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements, getCachedPrediction, storePrediction } from '@/lib/aiModel';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTooltip } from '@/contexts/TooltipContext';

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
  updateInterval = 600000, // Default: 10 minutes
  predictions = [],
  chartTimeframe = '4h'
}) => {
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);
  const { showTooltip, hideTooltip } = useTooltip();

  // Update prediction map when new predictions come in
  useEffect(() => {
    if (!predictions || predictions.length === 0) return;
    
    // Create map of symbol -> prediction for easy lookup
    const newPredictionMap = new Map<string, Prediction>();
    predictions.forEach(p => newPredictionMap.set(p.symbol, p));
    setPredictionMap(newPredictionMap);
    
    // Update prediction history
    const newHistory = { ...predictionHistory };
    
    predictions.forEach(prediction => {
      const history = newHistory[prediction.symbol] || [];
      
      // Only add new prediction if it's different from the last one or more than 15 minutes old
      const lastPrediction = history[0];
      const isDifferent = !lastPrediction || 
                          lastPrediction.bullish !== prediction.bullish || 
                          Math.abs(lastPrediction.confidence - prediction.confidence) > 0.1;
      const isOldEnough = !lastPrediction || 
                          (Date.now() - lastPrediction.timestamp) > 900000; // 15 minutes
      
      if (isDifferent || isOldEnough) {
        // Add new prediction to history
        history.unshift({
          timestamp: Date.now(),
          bullish: prediction.bullish,
          confidence: prediction.confidence,
          factors: prediction.factors
        });
        
        // Keep only the last 5 predictions
        newHistory[prediction.symbol] = history.slice(0, 5);
      }
    });
    
    setPredictionHistory(newHistory);
  }, [predictions]);

  // Apply visual effects based on predictions
  useEffect(() => {
    if (!svg || predictionMap.size === 0) return;
    
    // Remove existing overlays
    svg.selectAll(".prediction-overlay").remove();
    svg.selectAll(".prediction-pulse").remove();
    
    // Create group for prediction overlays
    const overlayGroup = svg.append("g").attr("class", "prediction-overlay");
    
    // Find all nodes in the visualization
    const nodeElements = svg.selectAll(".node");
    
    // Add visual indicators to nodes with predictions
    nodeElements.each(function(d: any) {
      const node = d3.select(this);
      const prediction = predictionMap.get(d.id);
      
      if (prediction) {
        const color = prediction.bullish 
          ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})` 
          : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;
        
        // Add pulsing effect based on prediction
        if (prediction.confidence > 0.6) {
          const pulse = overlayGroup.append("circle")
            .attr("class", "prediction-pulse")
            .attr("cx", d.x)
            .attr("cy", d.y)
            .attr("r", d.radius * 1.2)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("opacity", 0.7)
            .attr("pointer-events", "none");
            
          // Add pulsing animation
          pulse.append("animate")
            .attr("attributeName", "r")
            .attr("values", `${d.radius * 1.2};${d.radius * 1.8};${d.radius * 1.2}`)
            .attr("dur", prediction.bullish ? "3s" : "4s")
            .attr("repeatCount", "indefinite");
            
          pulse.append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0.7;0.3;0.7")
            .attr("dur", prediction.bullish ? "3s" : "4s")
            .attr("repeatCount", "indefinite");
        }
        
        node.on("mouseover", function(event) {
          const tooltipData = {
            id: d.id,
            name: prediction.name,
            price: prediction.price,
            aiAnalysis: {
              recommendation: prediction.bullish ? 'bullish' : 'bearish',
              confidence: prediction.confidence * 100,
            },
            keyFactors: prediction.factors,
          };
          showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
        })
        .on("mouseout", function() {
          hideTooltip();
        })
        .on("click", function(event) {
          if (prediction.confidence >= 0.7) {
            showStrategyModal(d.id, prediction);
          }
        });
      }
    });
    
    // Return cleanup function
    return () => {
      svg.selectAll(".prediction-overlay").remove();
      svg.selectAll(".prediction-pulse").remove();
    };
  }, [svg, predictionMap, predictionHistory, showTooltip, hideTooltip]);

  // Generate strategy data for a given symbol
  const showStrategyModal = (symbol: string, prediction: Prediction) => {
    // Use current price to generate mock strategy data
    const currentPrice = parseFloat(prediction.price || "0");
    
    // Create mock strategy based on bullish/bearish prediction
    if (prediction.bullish) {
      // Bullish strategy
      const stopLossPercent = 3 + Math.random() * 2; // 3-5% stop loss
      const takeProfitPercent1 = 5 + Math.random() * 5; // 5-10% take profit 1
      const takeProfitPercent2 = takeProfitPercent1 + 5 + Math.random() * 10; // 10-20% take profit 2
      
      const stopLoss = currentPrice * (1 - stopLossPercent / 100);
      const takeProfit1 = currentPrice * (1 + takeProfitPercent1 / 100);
      const takeProfit2 = currentPrice * (1 + takeProfitPercent2 / 100);
      
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
        direction: 'bullish',
        overview: `Based on ${prediction.factors.join(", ")}, ${symbol} is showing strong bullish potential in the ${chartTimeframe} timeframe. Entry around ${currentPrice.toFixed(2)} with a ${stopLossPercent.toFixed(1)}% stop loss and targets at ${takeProfitPercent1.toFixed(1)}% and ${takeProfitPercent2.toFixed(1)}%.`
      });
    } else {
      // Bearish strategy
      const stopLossPercent = 3 + Math.random() * 2; // 3-5% stop loss
      const takeProfitPercent1 = 5 + Math.random() * 5; // 5-10% take profit 1
      const takeProfitPercent2 = takeProfitPercent1 + 5 + Math.random() * 10; // 10-20% take profit 2
      
      const stopLoss = currentPrice * (1 + stopLossPercent / 100);
      const takeProfit1 = currentPrice * (1 - takeProfitPercent1 / 100);
      const takeProfit2 = currentPrice * (1 - takeProfitPercent2 / 100);
      
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
        direction: 'bearish',
        overview: `Based on ${prediction.factors.join(", ")}, ${symbol} is showing bearish signals in the ${chartTimeframe} timeframe. Short entry around ${currentPrice.toFixed(2)} with a ${stopLossPercent.toFixed(1)}% stop loss and targets at ${takeProfitPercent1.toFixed(1)}% and ${takeProfitPercent2.toFixed(1)}% to the downside.`
      });
    }
  };

  return (
    <>
      {/* Strategy Dialog */}
      <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img 
                src={selectedStrategy ? getLogoUrls(selectedStrategy.symbol)[0] : ''} 
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
    </>
  );
};

export default PredictionOrbitalOverlay;
