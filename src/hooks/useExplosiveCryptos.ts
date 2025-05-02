import { useState, useEffect } from 'react';
import { CryptoData } from '@/types/crypto';
import { 
  calculateRSI,
  calculateMACD,
  calculateEMA,
  calculateBollingerBands,
  EXPLOSIVE_CRITERIA,
  ExplosiveCriteria
} from '@/lib/technical';

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const [explosiveCryptos, setExplosiveCryptos] = useState<(CryptoData & { 
    score: number;
    criteriaHit: ExplosiveCriteria[];
  })[]>([]);

  useEffect(() => {
    const analyzeCryptos = () => {
      const analyzed = cryptos
        .map(crypto => {
          const prices = [parseFloat(crypto.price || '0')];
          const volumes = crypto.volume ? [crypto.volume.toString()] : [];

          // Calculate technical indicators
          const volumeEMA = calculateEMA(volumes.map(v => parseFloat(v)), 20);
          const macd = calculateMACD(prices);
          const ema9 = calculateEMA(prices, 9);
          const ema21 = calculateEMA(prices, 21);
          const bollingerBands = calculateBollingerBands(prices);

          // Calculate score and criteria
          let score = 0;
          const criteriaHit: ExplosiveCriteria[] = [];

          // Volume analysis
          if (volumes.length > 0 && volumes[0] > volumeEMA[volumeEMA.length - 1] * 1.5) {
            score += EXPLOSIVE_CRITERIA.volumeExplosive;
            criteriaHit.push('volumeExplosive');
          }

          // MACD analysis
          if (macd.histogram[macd.histogram.length - 1] > 0) {
            score += EXPLOSIVE_CRITERIA.macdCrossoverHigh;
            criteriaHit.push('macdCrossoverHigh');
          }

          // RSI analysis
          const rsi = crypto.rsi4h || 0;
          if (rsi >= 30 && rsi <= 50) {
            score += EXPLOSIVE_CRITERIA.rsiBuyZone;
            criteriaHit.push('rsiBuyZone');
          }

          // EMA crossover
          if (ema9[ema9.length - 1] > ema21[ema21.length - 1]) {
            score += EXPLOSIVE_CRITERIA.emaCrossover;
            criteriaHit.push('emaCrossover');
          }

          // Bollinger breakout
          const price = parseFloat(crypto.price || '0');
          if (price > bollingerBands.upper) {
            score += EXPLOSIVE_CRITERIA.bollingerBreakout;
            criteriaHit.push('bollingerBreakout');
          }

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