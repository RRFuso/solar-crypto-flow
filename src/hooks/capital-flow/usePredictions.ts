
// src/hooks/usePredictions.ts
import { useState, useEffect } from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
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
        const symbols = Array.from(new Set([
          ...flowData.map(f => f.from),
          ...flowData.map(f => f.to)
        ]));
        
        const cryptoData = await fetchCryptoData();
        const relevant = cryptoData.filter(c => symbols.includes(c.symbol));
        
        const filtered = selectedCategory !== 'all'
          ? relevant.filter(c => c.category === selectedCategory)
          : relevant;
        
        if (filtered.length) {
          const feats = await extractFeatures(filtered, flowData, chartTimeframe);
          const preds = predictPriceMovements(feats, chartTimeframe);
          setPredictions(preds);
          showAlerts(preds, chartTimeframe);
        }
      } catch (e) {
        console.error("Error updating AI predictions:", e);
      }
    };

    updatePredictions();
    const interval = setInterval(updatePredictions,
      ['5m','15m'].includes(chartTimeframe) ? 60_000 : 300_000
    );
    return () => clearInterval(interval);
  }, [flowData, selectedCategory, chartTimeframe]);

  const showAlerts = (ps: Prediction[], tf: string) => {
    ps.filter(p => p.confidence > 0.8).forEach(p => {
      const emoji = p.bullish ? '🚀' : '🔻';
      toast(`${emoji} ${p.symbol} signal (${tf})`, {
        description: `${p.factors.slice(0,2).join(' + ')} · ${Math.round(p.confidence*100)}%`,
        duration: 8000,
        className: p.bullish ? 'bg-green-900/60' : 'bg-red-900/60',
      });
    });
  };

  return { predictions };
};
