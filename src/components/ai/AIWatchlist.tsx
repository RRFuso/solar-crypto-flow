
import React from 'react';
import { Prediction } from '@/lib/aiModel';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';

interface AIWatchlistProps {
  predictions: Prediction[];
  maxItems?: number;
}

export const AIWatchlist: React.FC<AIWatchlistProps> = ({ predictions, maxItems = 5 }) => {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-gray-400 text-center">
        Waiting for AI predictions...
      </div>
    );
  }
  
  const bullishPredictions = predictions
    .filter(p => p.bullish)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxItems);
    
  const bearishPredictions = predictions
    .filter(p => !p.bullish)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxItems);

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 text-sm font-medium text-white border-b border-gray-800 bg-gray-800/50">
        AI Market Predictions
      </div>
      
      <div className="grid grid-cols-2 divide-x divide-gray-800">
        {/* Bullish Column */}
        <div className="p-3">
          <h4 className="text-xs uppercase text-green-400 font-semibold mb-2 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Bullish Signals
          </h4>
          <ul className="space-y-2">
            {bullishPredictions.length > 0 ? (
              bullishPredictions.map(prediction => (
                <PredictionItem 
                  key={prediction.symbol} 
                  prediction={prediction}
                  isBullish={true} 
                />
              ))
            ) : (
              <li className="text-xs text-gray-500 italic">No bullish signals detected</li>
            )}
          </ul>
        </div>
        
        {/* Bearish Column */}
        <div className="p-3">
          <h4 className="text-xs uppercase text-red-400 font-semibold mb-2 flex items-center">
            <ArrowDownRight className="w-3 h-3 mr-1" />
            Bearish Signals
          </h4>
          <ul className="space-y-2">
            {bearishPredictions.length > 0 ? (
              bearishPredictions.map(prediction => (
                <PredictionItem 
                  key={prediction.symbol} 
                  prediction={prediction}
                  isBullish={false} 
                />
              ))
            ) : (
              <li className="text-xs text-gray-500 italic">No bearish signals detected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface PredictionItemProps {
  prediction: Prediction;
  isBullish: boolean;
}

const PredictionItem: React.FC<PredictionItemProps> = ({ prediction, isBullish }) => {
  const confidencePercent = Math.round(prediction.confidence * 100);
  const logoUrl = getCryptoLogoUrl(prediction.symbol);
  
  return (
    <li className="flex items-start gap-2 p-2 rounded-md bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
      <img 
        src={logoUrl}
        alt={prediction.symbol}
        className="w-6 h-6 rounded-full mt-0.5" 
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm text-white">{prediction.symbol}</span>
          <span 
            className={`text-xs font-bold ${
              isBullish ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {confidencePercent}%
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {prediction.factors[0]}
        </div>
      </div>
    </li>
  );
};

export default AIWatchlist;
