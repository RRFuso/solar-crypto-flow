import { CryptoData } from '@/types/crypto';
import { 
  calculateRSI, 
  calculateBollingerBands, 
  calculateADX,
  calculateMACD,
  calculateEMA,
  calculateFibonacciLevels,
  calculateExplosiveScore,
  EXPLOSIVE_CRITERIA
} from '@/lib/technicalAnalysis';

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const explosiveCryptos = cryptos
    .map(crypto => {
      // Calculate technical indicators
      const prices = crypto.price ? [parseFloat(crypto.price)] : [];
      const volumes = crypto.volume ? [parseFloat(crypto.volume)] : [];
      
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

      // Calculate score
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

  return explosiveCryptos;
};