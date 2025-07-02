
import React, { useEffect, useState, useCallback } from 'react';
import { Prediction } from '@/lib/aiModel';
import { CryptoData } from '@/types/crypto';
import { fetchCryptoData, fetchCapitalFlows } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements, getCachedPrediction, storePrediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PredictionOrbitalOverlayProps {
  svg: SVGSVGElement;
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

  // Apply visual effects based on predictions using native DOM methods
  useEffect(() => {
    if (!svg || predictionMap.size === 0) return;
    
    // Remove existing overlays using native DOM methods
    const existingOverlays = svg.querySelectorAll(".prediction-overlay");
    existingOverlays.forEach(el => el.remove());
    const existingPulses = svg.querySelectorAll(".prediction-pulse");
    existingPulses.forEach(el => el.remove());
    
    // Create group for prediction overlays
    const overlayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    overlayGroup.setAttribute("class", "prediction-overlay");
    svg.appendChild(overlayGroup);
    
    // Find all nodes in the visualization
    const nodeElements = svg.querySelectorAll(".node");
    
    // Add visual indicators to nodes with predictions
    nodeElements.forEach((nodeElement, index) => {
      const nodeData = nodes[index];
      if (!nodeData) return;
      
      const prediction = predictionMap.get(nodeData.id);
      
      if (prediction) {
        const color = prediction.bullish 
          ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})` 
          : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;
        
        // Add pulsing effect based on prediction
        if (prediction.confidence > 0.6) {
          const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          pulse.setAttribute("class", "prediction-pulse");
          pulse.setAttribute("cx", (nodeData.x || 0).toString());
          pulse.setAttribute("cy", (nodeData.y || 0).toString());
          pulse.setAttribute("r", ((nodeData.radius || 20) * 1.2).toString());
          pulse.setAttribute("fill", "none");
          pulse.setAttribute("stroke", color);
          pulse.setAttribute("stroke-width", "3");
          pulse.setAttribute("opacity", "0.7");
          pulse.style.pointerEvents = "none";
          
          overlayGroup.appendChild(pulse);
            
          // Add pulsing animation using native SVG animation
          const animateRadius = document.createElementNS("http://www.w3.org/2000/svg", "animate");
          animateRadius.setAttribute("attributeName", "r");
          animateRadius.setAttribute("values", `${(nodeData.radius || 20) * 1.2};${(nodeData.radius || 20) * 1.8};${(nodeData.radius || 20) * 1.2}`);
          animateRadius.setAttribute("dur", prediction.bullish ? "3s" : "4s");
          animateRadius.setAttribute("repeatCount", "indefinite");
          pulse.appendChild(animateRadius);
          
          const animateOpacity = document.createElementNS("http://www.w3.org/2000/svg", "animate");
          animateOpacity.setAttribute("attributeName", "opacity");
          animateOpacity.setAttribute("values", "0.7;0.3;0.7");
          animateOpacity.setAttribute("dur", prediction.bullish ? "3s" : "4s");
          animateOpacity.setAttribute("repeatCount", "indefinite");
          pulse.appendChild(animateOpacity);
        }
        
        // Add tooltip and click behavior with prediction info using native event listeners
        nodeElement.addEventListener("mouseover", function(event: Event) {
          const mouseEvent = event as MouseEvent;
          
          // Create tooltip using native DOM
          const tooltip = document.createElement("div");
          tooltip.className = "prediction-tooltip";
          tooltip.style.cssText = `
            position: absolute;
            background-color: rgba(20, 20, 35, 0.9);
            border: 1px solid ${prediction.bullish ? "#00ff80" : "#ff3232"};
            border-radius: 6px;
            padding: 12px;
            color: white;
            font-size: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            pointer-events: none;
            transition: opacity 0.3s;
            opacity: 0;
            left: ${mouseEvent.pageX + 10}px;
            top: ${mouseEvent.pageY + 10}px;
          `;
            
          // Get prediction history for this symbol
          const history = predictionHistory[nodeData.id] || [];
          const historyItems = history.slice(0, 3).map((item, i) => {
            const time = new Date(item.timestamp).toLocaleTimeString();
            const direction = item.bullish ? "Bullish" : "Bearish";
            const factors = item.factors.slice(0, 1).join(" + ");
            return `<div style="margin-top: ${i > 0 ? '4px' : '0'}; color: ${item.bullish ? '#00ff80' : '#ff3232'};">
              ${time} - ${direction} (${factors})
            </div>`;
          }).join('');
            
          // Add logo and information to tooltip
          const logoUrl = getCryptoLogoUrl(nodeData.id);
          
          tooltip.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <img src="${logoUrl}" width="24" height="24" style="margin-right: 8px; border-radius: 50%;" 
                onerror="this.onerror=null; this.src='https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';">
              <span style="font-weight: bold;">${nodeData.id}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="color: ${prediction.bullish ? '#00ff80' : '#ff3232'}; font-weight: bold;">
                ${prediction.bullish ? '🚀 Bullish' : '🔻 Bearish'} (${Math.round(prediction.confidence * 100)}% confidence)
              </span>
            </div>
            <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Key factors:</div>
            <ul style="margin: 0 0 8px 0; padding-left: 16px;">
              ${prediction.factors.map(factor => `<li>${factor}</li>`).join('')}
            </ul>
            ${history.length > 1 ? `
              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; margin-top: 6px;">
                <div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Recent signals:</div>
                ${historyItems}
              </div>
            ` : ''}
            ${prediction.confidence >= 0.7 ? `
              <button id="view-strategy-${nodeData.id}" style="
                margin-top: 8px;
                padding: 5px 10px;
                background: rgba(0, 200, 255, 0.2);
                border: 1px solid rgba(0, 200, 255, 0.4);
                border-radius: 4px;
                color: #00c8ff;
                font-size: 11px;
                cursor: pointer;
                width: 100%;
                text-align: center;
              ">🔍 View Strategy</button>
            ` : ''}
          `;
          
          document.body.appendChild(tooltip);
          setTimeout(() => tooltip.style.opacity = "1", 10);
          
        // Add event listener to strategy button
        if (prediction.confidence >= 0.7) {
          const strategyButton = tooltip.querySelector(`#view-strategy-${nodeData.id}`);
          if (strategyButton) {
            strategyButton.addEventListener("click", function(e: Event) {
              e.stopPropagation();
              showStrategyModal(nodeData.id, prediction);
            });
          }
        }
        });
        
        nodeElement.addEventListener("mousemove", function(event: Event) {
          const mouseEvent = event as MouseEvent;
          const tooltip = document.querySelector(".prediction-tooltip") as HTMLElement;
          if (tooltip) {
            tooltip.style.left = `${mouseEvent.pageX + 10}px`;
            tooltip.style.top = `${mouseEvent.pageY + 10}px`;
          }
        });
        
        nodeElement.addEventListener("mouseout", function() {
          const tooltip = document.querySelector(".prediction-tooltip");
          if (tooltip) {
            tooltip.remove();
          }
        });
        
        nodeElement.addEventListener("click", function(event: Event) {
          if (prediction.confidence >= 0.7) {
            showStrategyModal(nodeData.id, prediction);
          }
        });
      }
    });
    
    // Return cleanup function
    return () => {
      const overlays = svg.querySelectorAll(".prediction-overlay");
      overlays.forEach(el => el.remove());
      const pulses = svg.querySelectorAll(".prediction-pulse");
      pulses.forEach(el => el.remove());
    };
  }, [svg, predictionMap, predictionHistory, nodes]);

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
    </>
  );
};

export default PredictionOrbitalOverlay;
