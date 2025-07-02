
import { useState, useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { normalizeFeatures, extractFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements } from '@/lib/aiModel';
import { toast } from 'sonner';

export const usePredictions = (chartTimeframe: string) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    const updatePredictions = async () => {
      try {
        // Get crypto data
        const cryptoData = await fetchCryptoData();
        
        if (cryptoData.length > 0) {
          // Get features and make predictions with the selected chart timeframe
          const features = await extractFeatures(cryptoData, [], chartTimeframe);
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
    // Update predictions whenever chart timeframe changes
    const intervalTime = chartTimeframe === '5m' || chartTimeframe === '15m' ? 60000 : 300000;
    const interval = setInterval(updatePredictions, intervalTime);
    
    return () => clearInterval(interval);
  }, [chartTimeframe]);

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

  return { filteredPredictions: predictions };
};
