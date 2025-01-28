import { CryptoData } from '@/types/crypto';
import { checkGoldenCross, checkVolumeSpike } from '@/lib/technicalAnalysis';

const SCORE_CRITERIA = {
  volumeMultiplier: 20,
  rsiThreshold: 50,
  goldenCross: 30,
  priceChange: 20
};

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  const explosiveCryptos = cryptos
    .map(crypto => {
      let score = 0;

      // Volume spike check (if volume data is available)
      if (crypto.volume) {
        const volumes = [parseFloat(crypto.volume)];
        if (checkVolumeSpike(volumes)) {
          score += SCORE_CRITERIA.volumeMultiplier;
        }
      }

      // RSI check
      if ((crypto.rsi4h || 0) > SCORE_CRITERIA.rsiThreshold) {
        score += SCORE_CRITERIA.rsiThreshold;
      }

      // Golden cross check (if EMA data is available)
      if (crypto.ema12 && crypto.ema26 && crypto.ema12 > crypto.ema26) {
        score += SCORE_CRITERIA.goldenCross;
      }

      // Price change check
      if (crypto.performance > 5) {
        score += SCORE_CRITERIA.priceChange;
      }

      return {
        ...crypto,
        score
      };
    })
    .filter(crypto => crypto.score >= 70)
    .sort((a, b) => b.score - a.score);

  return explosiveCryptos;
};