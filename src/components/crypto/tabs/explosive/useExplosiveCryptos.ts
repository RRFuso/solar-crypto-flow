import { CryptoData } from '@/types/crypto';
import { 
  calculateRSI, 
  calculateBollingerBands, 
  calculateADX, 
  checkVolumeSpike 
} from '@/lib/technicalAnalysis';

const SCORE_CRITERIA = {
  volumeMultiplier: 20,
  rsiThreshold: 50,
  bollingerCompression: 30,
  adxRange: 20,
  priceChange: 20
};

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const explosiveCryptos = cryptos
    .map(crypto => {
      let score = 0;

      // Volume accumulation check
      if (crypto.volume) {
        const volumes = [parseFloat(crypto.volume)];
        if (checkVolumeSpike(volumes)) {
          score += SCORE_CRITERIA.volumeMultiplier;
        }
      }

      // RSI check (looking for 50-60 range)
      const rsi = crypto.rsi4h || 0;
      if (rsi >= 50 && rsi <= 60) {
        score += SCORE_CRITERIA.rsiThreshold;
      }

      // Bollinger Bands check
      if (crypto.price) {
        const prices = [parseFloat(crypto.price)];
        const bollinger = calculateBollingerBands(prices);
        if (bollinger.width < 0.05) {
          score += SCORE_CRITERIA.bollingerCompression;
        }
      }

      // ADX check (15-25 range)
      if (crypto.high24h && crypto.low24h && crypto.price) {
        const adx = calculateADX(
          [parseFloat(crypto.high24h)],
          [parseFloat(crypto.low24h)],
          [parseFloat(crypto.price)]
        );
        if (adx >= 15 && adx <= 25) {
          score += SCORE_CRITERIA.adxRange;
        }
      }

      // Price change check (looking for moderate changes)
      if (crypto.performance > 0 && crypto.performance < 3) {
        score += SCORE_CRITERIA.priceChange;
      }

      return {
        ...crypto,
        score,
        isAccumulating: checkVolumeSpike([parseFloat(crypto.volume || '0')]),
        rsiLevel: rsi,
        adxLevel: crypto.high24h ? calculateADX(
          [parseFloat(crypto.high24h)],
          [parseFloat(crypto.low24h)],
          [parseFloat(crypto.price || '0')]
        ) : 0
      };
    })
    .filter(crypto => 
      crypto.score >= 70 && 
      (crypto.performance || 0) < 3 && // No explosive moves yet
      (crypto.rsi4h || 0) <= 60 // Not overbought
    )
    .sort((a, b) => b.score - a.score);

  return explosiveCryptos;
};