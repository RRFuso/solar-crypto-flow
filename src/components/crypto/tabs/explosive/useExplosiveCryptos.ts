import { CryptoData } from '@/types/crypto';
import { 
  calculateRSI, 
  calculateBollingerBands, 
  calculateADX,
  calculateMACD,
  calculateEMA,
  calculateFibonacciLevels
} from '@/lib/technical';

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
      try {
        let score = 0;
        const criteriaHit: string[] = [];

        // Validate required data
        if (!crypto.price || !crypto.volume || !crypto.high24h || !crypto.low24h) {
          console.log(`Missing required data for ${crypto.id}`);
          return null;
        }

        // Volume analysis with validation
        const volume = parseFloat(crypto.volume);
        if (!isNaN(volume) && volume > 0) {
          const volumeMA = volume * 1.2; // Reduced from 1.5 to 1.2
          if (volume > volumeMA) {
            score += SCORE_CRITERIA.volumeExplosive;
            criteriaHit.push('Volume explosivo');
          }
        }

        // RSI analysis with validation
        const rsi = crypto.rsi4h || 0;
        if (rsi > 0) {
          if (rsi >= 35 && rsi <= 65) { // Expanded range from 40-55 to 35-65
            score += SCORE_CRITERIA.rsiBuyZone;
            criteriaHit.push('RSI zona de compra');
          }
        }

        // Price and technical analysis
        const price = parseFloat(crypto.price);
        const high = parseFloat(crypto.high24h);
        const low = parseFloat(crypto.low24h);

        if (!isNaN(price) && !isNaN(high) && !isNaN(low)) {
          // MACD analysis
          const prices = [price];
          const { histogram } = calculateMACD(prices);
          if (histogram[histogram.length - 1] > -0.1) { // Changed from > 0 to > -0.1
            score += SCORE_CRITERIA.macdCrossover;
            criteriaHit.push('MACD próximo cruzamento');
          }

          // ADX analysis
          const adx = calculateADX([high], [low], [price]);
          if (adx > 15) { // Reduced from 20 to 15
            score += SCORE_CRITERIA.adxStrength;
            criteriaHit.push('ADX moderado');
          }

          // EMA crossover
          const ema9 = calculateEMA([price], 9);
          const ema21 = calculateEMA([price], 21);
          if (ema9[ema9.length - 1] > ema21[ema21.length - 1] * 0.98) { // Added 2% tolerance
            score += SCORE_CRITERIA.emaCrossover;
            criteriaHit.push('EMA9 próximo EMA21');
          }

          // Fibonacci support
          const fibs = calculateFibonacciLevels(high, low);
          const isNearFib = fibs.some(fib => 
            Math.abs(price - fib.price) / price < 0.015 && // Increased tolerance from 0.01 to 0.015
            (fib.level === 0.382 || fib.level === 0.618)
          );
          
          if (isNearFib) {
            score += SCORE_CRITERIA.fibonacciSupport;
            criteriaHit.push('Próximo Fibonacci');
          }

          // Bollinger Bands analysis
          const { upper } = calculateBollingerBands([price]);
          if (price > upper * 0.95) { // Added 5% tolerance
            score += SCORE_CRITERIA.bollingerBreakout;
            criteriaHit.push('Próximo Bollinger');
          }
        }

        return {
          ...crypto,
          score,
          criteriaHit,
          isExplosive: score >= 8 // Reduced threshold from 10 to 8
        };
      } catch (error) {
        console.error(`Error processing ${crypto.id}:`, error);
        return null;
      }
    })
    .filter((crypto): crypto is (CryptoData & { 
      score: number; 
      criteriaHit: string[]; 
      isExplosive: boolean 
    }) => 
      crypto !== null && 
      crypto.score >= 8 // Reduced threshold from 10 to 8
    )
    .sort((a, b) => b.score - a.score);

  console.log('Explosive cryptos found:', explosiveCryptos.length);
  return explosiveCryptos;
};
