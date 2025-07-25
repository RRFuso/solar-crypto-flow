import { useState, useEffect } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel'; // Keep Prediction interface
import { fetchCryptoData } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
import { toast } from 'sonner';
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

// Define a interface para os sinais de price action como armazenados no DB
interface CryptoPriceActionSignal {
  symbol: string;
  explosive_potential: 'High' | 'Medium' | 'Low' | 'None';
  is_breakout: boolean;
  is_expansion: boolean;
  is_accelerating: boolean;
  last_updated: string;
}

export const usePredictions = (
  flowData: FlowData[] | undefined,
  selectedCategory: string,
  chartTimeframe: string
) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const { contractAddressesCache } = useOnChainData();

  useEffect(() => {
    const updatePredictions = async () => {
      if (!flowData || flowData.length === 0) return;

      try {
        // Fetch all crypto data for names and prices
        const allCryptoData = await fetchCryptoData();
        const cryptoDataMap = new Map(allCryptoData.map(c => [c.symbol, c]));

        // Fetch signals from the Supabase table
        const { data: signalsData, error: signalsError } = await supabase
          .from('crypto_price_action_signals')
          .select('*');

        if (signalsError) {
          console.error('Error fetching price action signals:', signalsError);
          return;
        }

        const newPredictions: Prediction[] = [];

        for (const signal of signalsData as CryptoPriceActionSignal[]) {
          const cryptoInfo = cryptoDataMap.get(signal.symbol);
          if (!cryptoInfo) continue; // Skip if crypto info not found

          let bullish = false;
          let confidence = 0.5; // Default confidence
          const factors: string[] = [];

          // Derive bullish, confidence, and factors from explosive_potential
          switch (signal.explosive_potential) {
            case 'High':
              bullish = true;
              confidence = 0.9;
              factors.push('Explosive Potential: High');
              break;
            case 'Medium':
              bullish = true;
              confidence = 0.7;
              factors.push('Explosive Potential: Medium');
              break;
            case 'Low':
              bullish = true;
              confidence = 0.5;
              factors.push('Explosive Potential: Low');
              break;
            case 'None':
            default:
              bullish = false; // Or neutral
              confidence = 0.3;
              factors.push('No Explosive Potential');
              break;
          }

          if (signal.is_breakout) factors.push('Breakout Detected');
          if (signal.is_expansion) factors.push('Volatility Expansion');
          if (signal.is_accelerating) factors.push('Momentum Acceleration');

          newPredictions.push({
            symbol: signal.symbol,
            name: cryptoInfo.name,
            bullish: bullish,
            confidence: confidence,
            factors: factors.length > 0 ? factors : ['General AI Analysis'],
            timestamp: new Date(signal.last_updated).getTime(),
            price: cryptoInfo.price.toString(),
            explosivePotential: signal.explosive_potential,
            isBreakout: signal.is_breakout,
            isExpansion: signal.is_expansion,
            isAccelerating: signal.is_accelerating,
          });
        }

        // Filter by category if needed (logic from original usePredictions)
        const categoryFilteredPredictions = selectedCategory !== 'all'
          ? newPredictions.filter(p => {
              const crypto = allCryptoData.find(c => c.symbol === p.symbol);
              return crypto && crypto.category === selectedCategory;
            })
          : newPredictions;

        console.log('Fetched predictions from Supabase table:', categoryFilteredPredictions);
        setPredictions(categoryFilteredPredictions);
        showPredictionAlerts(categoryFilteredPredictions, chartTimeframe);

      } catch (error) {
        console.error("Error updating AI predictions from Supabase:", error);
      }
    };

    updatePredictions();
    // Use a shorter interval for shorter timeframes, or keep it consistent with populate-crypto-signals
    const intervalTime = chartTimeframe === '5m' || chartTimeframe === '15m' ? 60000 : 300000; // 1 min or 5 min
    const interval = setInterval(updatePredictions, intervalTime);

    return () => clearInterval(interval);
  }, [flowData, selectedCategory, chartTimeframe, contractAddressesCache]);

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
