import { useState, useEffect } from 'react';
import { 
  calculateRSI, 
  calculateMACD, 
  calculateOBV,
  calculateFibonacciLevels,
  calculateEMA 
} from '@/lib/technicalAnalysis';
import { CryptoData } from '@/types/crypto';

interface ExplosiveCriteria {
  rsiRange: { min: number; max: number };
  volumeMultiplier: number;
  priceChangeThreshold: number;
}

const defaultCriteria: ExplosiveCriteria = {
  rsiRange: { min: 40, max: 55 },
  volumeMultiplier: 1.5,
  priceChangeThreshold: 2
};

export const useExplosiveCryptos = (
  cryptos: CryptoData[],
  criteria: ExplosiveCriteria = defaultCriteria
) => {
  const [explosiveCryptos, setExplosiveCryptos] = useState<(CryptoData & { score: number })[]>([]);

  useEffect(() => {
    const analyzeCryptos = () => {
      const analyzed = cryptos
        .map(crypto => {
          let score = 0;
          const prices = [parseFloat(crypto.price || '0')];
          const volumes = [parseFloat(crypto.volume || '0')];

          // Volume analysis
          const volumeEMA = calculateEMA(volumes, 20);
          const hasHighVolume = volumes[volumes.length - 1] > 
            volumeEMA[volumeEMA.length - 1] * criteria.volumeMultiplier;
          if (hasHighVolume) score += 30;

          // RSI check
          const rsi = crypto.rsi4h || 0;
          if (rsi >= criteria.rsiRange.min && rsi <= criteria.rsiRange.max) {
            score += 20;
          }

          // MACD analysis
          const { histogram } = calculateMACD(prices);
          const macdCrossing = histogram[histogram.length - 1] > 0 && 
            histogram[histogram.length - 2] <= 0;
          if (macdCrossing) score += 15;

          // OBV trend
          const obv = calculateOBV(prices, volumes);
          const obvUptrend = obv[obv.length - 1] > obv[obv.length - 2];
          if (obvUptrend) score += 15;

          // Price performance vs BTC
          if ((crypto.performance || 0) > 0) {
            score += 20;
          }

          return {
            ...crypto,
            score,
            isExplosive: score >= 70
          };
        })
        .filter(crypto => crypto.score >= 70)
        .sort((a, b) => b.score - a.score);

      setExplosiveCryptos(analyzed);
    };

    analyzeCryptos();
  }, [cryptos, criteria]);

  return explosiveCryptos;
};