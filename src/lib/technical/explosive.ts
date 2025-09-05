import { calculateFibonacciLevels } from './fibonacci';
import { EXPLOSIVE_CRITERIA, ExplosiveCriteria } from './constants';

export const calculateExplosiveScore = (
  crypto: {
    volume?: string;
    price?: string;
    high24h?: string;
    low24h?: string;
    rsi4h?: number;
    marketCap?: number;
    change24h?: number;
  },
  technicalData: {
    volumeEMA: number[];
    macd: { macd: number[]; signal: number[]; histogram: number[] };
    ema9: number[];
    ema21: number[];
    adx: number;
    bollingerBands: {
      middle: number;
      upper: number;
      lower: number;
      width: number;
    };
  }
): { score: number; criteriaHit: ExplosiveCriteria[] } => {
  let score = 0;
  const criteriaHit: ExplosiveCriteria[] = [];

  const currentVolume = parseFloat(crypto.volume || '0');
  const volumeEMA = technicalData.volumeEMA[technicalData.volumeEMA.length - 1];
  if (currentVolume > volumeEMA * 1.5) {
    score += EXPLOSIVE_CRITERIA.volumeExplosive;
    criteriaHit.push('volumeExplosive');
  }

  const lastMACD = technicalData.macd.macd[technicalData.macd.macd.length - 1];
  const lastSignal = technicalData.macd.signal[technicalData.macd.signal.length - 1];
  if (lastMACD > lastSignal) {
    score += EXPLOSIVE_CRITERIA.macdCrossoverHigh;
    criteriaHit.push('macdCrossoverHigh');
  }

  if (crypto.rsi4h && crypto.rsi4h >= 30 && crypto.rsi4h <= 50) {
    score += EXPLOSIVE_CRITERIA.rsiBuyZone;
    criteriaHit.push('rsiBuyZone');
  }

  if (technicalData.adx > 20) {
    score += EXPLOSIVE_CRITERIA.adxStrength;
    criteriaHit.push('adxStrength');
  }

  const lastEMA9 = technicalData.ema9[technicalData.ema9.length - 1];
  const lastEMA21 = technicalData.ema21[technicalData.ema21.length - 1];
  if (lastEMA9 > lastEMA21) {
    score += EXPLOSIVE_CRITERIA.emaCrossover;
    criteriaHit.push('emaCrossover');
  }

  const currentPrice = parseFloat(crypto.price || '0');
  if (currentPrice > technicalData.bollingerBands.upper) {
    score += EXPLOSIVE_CRITERIA.bollingerBreakout;
    criteriaHit.push('bollingerBreakout');
  }

  if (crypto.high24h && crypto.low24h && crypto.price) {
    const fibs = calculateFibonacciLevels(
      parseFloat(crypto.high24h),
      parseFloat(crypto.low24h)
    );
    const price = parseFloat(crypto.price);
    const isNearFib = fibs.some(fib => 
      Math.abs(price - fib.price) / price < 0.01 && 
      (fib.level === 0.382 || fib.level === 0.618)
    );
    
    if (isNearFib) {
      score += EXPLOSIVE_CRITERIA.fibonacciSupport;
      criteriaHit.push('fibonacciSupport');
    }
  }

  // Low market cap bonus for altseason potential
  const marketCap = crypto.marketCap || 0;
  if (marketCap > 0 && marketCap < 100_000_000) { // Less than $100M
    score += 3; // Significant bonus for low caps
    criteriaHit.push('lowMarketCap' as ExplosiveCriteria);
  } else if (marketCap < 500_000_000) { // Less than $500M
    score += 2; // Moderate bonus for mid-low caps
    criteriaHit.push('midLowMarketCap' as ExplosiveCriteria);
  }

  // Penalize cryptos that already pumped significantly
  const change24h = crypto.change24h || 0;
  if (change24h > 20) {
    score = Math.max(0, score - 2); // Reduce score for already pumped coins
  }

  return { score, criteriaHit };
};