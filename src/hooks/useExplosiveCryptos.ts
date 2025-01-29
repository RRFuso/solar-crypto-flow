import { useState, useEffect } from 'react';
import { 
  calculateRSI, 
  calculateMACD, 
  calculateEMA,
  calculateBollingerBands,
  calculateADX,
  calculateExplosiveScore,
  EXPLOSIVE_CRITERIA
} from '@/lib/technicalAnalysis';
import { CryptoData } from '@/types/crypto';

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const [explosiveCryptos, setExplosiveCryptos] = useState<(CryptoData & { 
    score: number;
    criteriaHit: string[];
  })[]>([]);

  useEffect(() => {
    const analyzeCryptos = () => {
      const analyzed = cryptos
        .map(crypto => {
          const prices = [parseFloat(crypto.price || '0')];
          const volumes = crypto.volume ? [parseFloat(crypto.volume)] : [];

          // Calculate technical indicators
          const volumeEMA = calculateEMA(volumes, 20);
          const macd = calculateMACD(prices);
          const ema9 = calculateEMA(prices, 9);
          const ema21 = calculateEMA(prices, 21);
          const bollingerBands = calculateBollingerBands(prices);
          const adx = crypto.high24h && crypto.low24h && crypto.price
            ? calculateADX(
                [parseFloat(crypto.high24h)],
                [parseFloat(crypto.low24h)],
                [parseFloat(crypto.price)]
              )
            : 0;

          // Calculate explosive score
          const { score, criteriaHit } = calculateExplosiveScore(crypto, {
            volumeEMA,
            macd,
            ema9,
            ema21,
            adx,
            bollingerBands
          });

          return {
            ...crypto,
            score,
            criteriaHit,
            isExplosive: score >= 10
          };
        })
        .filter(crypto => crypto.score >= 10)
        .sort((a, b) => b.score - a.score);

      setExplosiveCryptos(analyzed);
    };

    analyzeCryptos();
  }, [cryptos]);

  return explosiveCryptos;
};