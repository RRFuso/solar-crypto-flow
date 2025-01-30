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
  fibonacciSupport: 2,
  bollingerBreakout: 1
};

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const explosiveCryptos = cryptos
    .map(crypto => {
      let score = 0;
      const criteriaHit: string[] = [];

      // Volume analysis
      if (crypto.volume) {
        const volume = parseFloat(crypto.volume);
        const volumeMA = volume * 1.5; // Simple volume threshold
        if (volume > volumeMA) {
          score += SCORE_CRITERIA.volumeExplosive;
          criteriaHit.push('Volume explosivo');
        }
      }

      // RSI analysis
      const rsi = crypto.rsi4h || 0;
      if (rsi >= 40 && rsi <= 55) {
        score += SCORE_CRITERIA.rsiBuyZone;
        criteriaHit.push('RSI zona de compra');
      }

      // Price and technical analysis
      if (crypto.price && crypto.high24h && crypto.low24h) {
        const price = parseFloat(crypto.price);
        const high = parseFloat(crypto.high24h);
        const low = parseFloat(crypto.low24h);

        // MACD analysis
        const prices = [price];
        const { histogram } = calculateMACD(prices);
        if (histogram[histogram.length - 1] > 0 && histogram[histogram.length - 2] <= 0) {
          score += SCORE_CRITERIA.macdCrossover;
          criteriaHit.push('MACD cruzamento alta');
        }

        // ADX analysis
        const adx = calculateADX([high], [low], [price]);
        if (adx > 20) {
          score += SCORE_CRITERIA.adxStrength;
          criteriaHit.push('ADX forte');
        }

        // EMA crossover
        const ema9 = calculateEMA([price], 9);
        const ema21 = calculateEMA([price], 21);
        if (ema9[ema9.length - 1] > ema21[ema21.length - 1]) {
          score += SCORE_CRITERIA.emaCrossover;
          criteriaHit.push('EMA9 cruzou EMA21');
        }

        // Fibonacci support
        const fibs = calculateFibonacciLevels(high, low);
        const isNearFib = fibs.some(fib => 
          Math.abs(price - fib.price) / price < 0.01 && 
          (fib.level === 0.382 || fib.level === 0.618)
        );
        
        if (isNearFib) {
          score += SCORE_CRITERIA.fibonacciSupport;
          criteriaHit.push('Suporte Fibonacci');
        }

        // Bollinger Bands analysis
        const { upper } = calculateBollingerBands([price]);
        if (price > upper) {
          score += SCORE_CRITERIA.bollingerBreakout;
          criteriaHit.push('Rompimento Bollinger');
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