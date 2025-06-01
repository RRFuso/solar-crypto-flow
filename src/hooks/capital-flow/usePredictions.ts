
import { useState, useEffect } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { normalizeFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements } from '@/lib/aiModel';
import { toast } from 'sonner';

export const usePredictions = (
  flowData: FlowData[] | undefined, 
  selectedCategory: string, 
  chartTimeframe: string
) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const updatePredictions = async () => {
      if (!flowData || flowData.length === 0) return;
      
      try {
        // Get unique crypto symbols from the flow data
        const symbols = [...new Set([
          ...flowData.map(flow => flow.from),
          ...flowData.map(flow => flow.to)
        ])];
        
        // Get crypto data for these symbols
        const cryptoData = await fetchCryptoData();
        const relevantCryptos = cryptoData.filter(
          crypto => symbols.includes(crypto.symbol)
        );
        
        if (relevantCryptos.length > 0) {
          // Apply category filter if needed
          const categoryFilteredCryptos = selectedCategory !== 'all' 
            ? relevantCryptos.filter(crypto => crypto.category === selectedCategory)
            : relevantCryptos;
            
          // Get features and make predictions with the selected chart timeframe
          const features = await extractFeatures(categoryFilteredCryptos, flowData, chartTimeframe);
          const newPredictions = predictPriceMovements(features, chartTimeframe);
          setPredictions(newPredictions);
          
          // Show notifications for high confidence predictions
          showPredictionAlerts(newPredictions, chartTimeframe);
        }
      } catch (error) {
        console.error("Error updating AI predictions:", error);
      }
    };
    
    updatePredictions();
    // Update predictions whenever flow data, category, or chart timeframe changes
    // Use a shorter interval for shorter timeframes
    const intervalTime = chartTimeframe === '5m' || chartTimeframe === '15m' ? 60000 : 300000;
    const interval = setInterval(updatePredictions, intervalTime);
    
    return () => clearInterval(interval);
  }, [flowData, selectedCategory, chartTimeframe]);

  // Show notifications for high confidence predictions
  const showPredictionAlerts = (predictions: Prediction[], timeframe: string) => {
    const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
    
    highConfidencePredictions.forEach(prediction => {
      const emoji = prediction.bullish ? '🚀' : '🔻';
      const direction = prediction.bullish ? 'bullish' : 'bearish';
      const factors = prediction.factors.slice(0, 2).join(' + ');
      
      toast(`${emoji} ${prediction.symbol} ${direction} signal (${timeframe})`, {
        description: `${factors}. Confidence: ${Math.round(prediction.confidence * 100)}%`,
        duration: 8000,
        className: prediction.bullish ? 'bg-green-900/60' : 'bg-red-900/60',
      });
    });
  };

  return { predictions };
};
