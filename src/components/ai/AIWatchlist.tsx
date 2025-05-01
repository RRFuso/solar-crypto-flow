
import React, { useState } from 'react'; 
import { Prediction } from '@/lib/aiModel'; 
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIWatchlistProps {
  predictions: Prediction[];
  maxItems?: number;
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

const AIWatchlist: React.FC<AIWatchlistProps> = ({ predictions, maxItems = 5, chartTimeframe = '4h' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  // Sort by confidence level (highest first)
  const sortedPredictions = [...predictions]
    .sort((a, b) => b.confidence - a.confidence);
    
  // Apply search filter if there is a search term
  const filteredPredictions = searchTerm 
    ? sortedPredictions.filter(p => 
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sortedPredictions;
      
  // Limit the number of items shown
  const displayPredictions = filteredPredictions.slice(0, maxItems);
  
  // Generate strategy data for a given symbol
  const showStrategyModal = (prediction: Prediction) => {
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
        symbol: prediction.symbol,
        name: prediction.name || prediction.symbol,
        entry: currentPrice.toFixed(2),
        stopLoss: stopLoss.toFixed(2),
        takeProfit1: takeProfit1.toFixed(2),
        takeProfit2: takeProfit2.toFixed(2),
        risk: `${stopLossPercent.toFixed(1)}%`,
        reward: `${takeProfitPercent2.toFixed(1)}%`,
        timeframe: chartTimeframe,
        direction: 'bullish',
        overview: `Based on ${prediction.factors.join(", ")}, ${prediction.symbol} is showing strong bullish potential in the ${chartTimeframe} timeframe. Entry around ${currentPrice.toFixed(2)} with a ${stopLossPercent.toFixed(1)}% stop loss and targets at ${takeProfitPercent1.toFixed(1)}% and ${takeProfitPercent2.toFixed(1)}%.`
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
        symbol: prediction.symbol,
        name: prediction.name || prediction.symbol,
        entry: currentPrice.toFixed(2),
        stopLoss: stopLoss.toFixed(2),
        takeProfit1: takeProfit1.toFixed(2),
        takeProfit2: takeProfit2.toFixed(2),
        risk: `${stopLossPercent.toFixed(1)}%`,
        reward: `${takeProfitPercent2.toFixed(1)}%`,
        timeframe: chartTimeframe,
        direction: 'bearish',
        overview: `Based on ${prediction.factors.join(", ")}, ${prediction.symbol} is showing bearish signals in the ${chartTimeframe} timeframe. Short entry around ${currentPrice.toFixed(2)} with a ${stopLossPercent.toFixed(1)}% stop loss and targets at ${takeProfitPercent1.toFixed(1)}% and ${takeProfitPercent2.toFixed(1)}% to the downside.`
      });
    }
  };

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-white/10 bg-black/30">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            AI Signal Watchlist
          </span>
          <span className="ml-auto text-xs text-white/50">{chartTimeframe}</span>
        </h3>
        
        <div className="mt-2 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search symbol..."
            className="w-full bg-black/30 border border-white/10 rounded-md p-2 pl-8 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/50" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {displayPredictions.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">
            No signals detected
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {displayPredictions.map(prediction => (
              <div 
                key={prediction.symbol} 
                className={`p-3 rounded-md hover:bg-white/5 transition-colors ${
                  prediction.confidence >= 0.8 ? (prediction.bullish ? 'bg-green-900/20' : 'bg-red-900/20') : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src={getCryptoLogoUrl(prediction.symbol)} 
                    alt={prediction.symbol} 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (e.target as HTMLImageElement).src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{prediction.symbol}</span>
                      <span 
                        className={`flex items-center ${
                          prediction.bullish ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {prediction.bullish ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span className="truncate">{prediction.factors[0]}</span>
                      {prediction.confidence >= 0.6 && (
                        <button 
                          className="ml-2 px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs transition-colors"
                          onClick={() => showStrategyModal(prediction)}
                        >
                          🔍 View Strategy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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
    </div>
  );
};

export default AIWatchlist;
