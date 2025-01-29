import { CryptoData } from '@/types/crypto';
import { 
  calculateRSI, 
  calculateBollingerBands, 
  calculateADX,
  calculateMACD,
  calculateEMA,
  calculateFibonacciLevels
} from '@/lib/technicalAnalysis';

const SCORE_CRITERIA = {
  volumeExplosive: 3,
  macdCrossover: 2,
  rsiBuyZone: 2,
  adxStrength: 1,
  emaCrossover: 3,
  fibonacciSupport: 2
};

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const explosiveCryptos = cryptos
    .map(crypto => {
      let score = 0;
      const criteriaHit: string[] = [];

      // Volume analysis
      if (crypto.volume) {
        const volumes = [parseFloat(crypto.volume)];
        const volumeEMA = calculateEMA(volumes, 20);
        if (volumes[volumes.length - 1] > volumeEMA[volumeEMA.length - 1]) {
          score += SCORE_CRITERIA.volumeExplosive;
          criteriaHit.push('Volume explosivo');
        }
      }

      // MACD analysis
      if (crypto.price) {
        const prices = [parseFloat(crypto.price)];
        const { histogram } = calculateMACD(prices);
        if (histogram[histogram.length - 1] > 0 && histogram[histogram.length - 2] <= 0) {
          score += SCORE_CRITERIA.macdCrossover;
          criteriaHit.push('MACD cruzamento alta');
        }
      }

      // RSI analysis
      const rsi = crypto.rsi4h || 0;
      if (rsi >= 40 && rsi <= 55) {
        score += SCORE_CRITERIA.rsiBuyZone;
        criteriaHit.push('RSI zona de compra');
      }

      // ADX analysis
      if (crypto.high24h && crypto.low24h && crypto.price) {
        const adx = calculateADX(
          [parseFloat(crypto.high24h)],
          [parseFloat(crypto.low24h)],
          [parseFloat(crypto.price)]
        );
        if (adx > 20) {
          score += SCORE_CRITERIA.adxStrength;
          criteriaHit.push('ADX forte');
        }
      }

      // EMA crossover
      if (crypto.price) {
        const prices = [parseFloat(crypto.price)];
        const ema9 = calculateEMA(prices, 9);
        const ema21 = calculateEMA(prices, 21);
        if (ema9[ema9.length - 1] > ema21[ema21.length - 1] && 
            ema9[ema9.length - 2] <= ema21[ema21.length - 2]) {
          score += SCORE_CRITERIA.emaCrossover;
          criteriaHit.push('EMA9 cruzou EMA21');
        }
      }

      // Fibonacci support
      if (crypto.high24h && crypto.low24h) {
        const high = parseFloat(crypto.high24h);
        const low = parseFloat(crypto.low24h);
        const price = parseFloat(crypto.price || '0');
        const fibs = calculateFibonacciLevels(high, low);
        const isNearFib = fibs.some(fib => 
          Math.abs(price - fib.price) / price < 0.01 && 
          (fib.level === 0.382 || fib.level === 0.618)
        );
        
        if (isNearFib) {
          score += SCORE_CRITERIA.fibonacciSupport;
          criteriaHit.push('Suporte Fibonacci');
        }
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

  return explosiveCryptos;
};