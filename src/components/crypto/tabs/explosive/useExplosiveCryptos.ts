import { CryptoData } from '@/types/crypto';

export const useExplosiveCryptos = (cryptos: CryptoData[]) => {
  return cryptos.filter(crypto => {
    const hasHighVolume = crypto.volume ? parseFloat(crypto.volume) > 1_000_000 : false;
    const hasSignificantChange = Math.abs(crypto.performance) > 10;
    const hasRsiMomentum = crypto.rsi4h ? crypto.rsi4h > 40 && crypto.rsi4h < 65 : false;
    const isUptrend = crypto.ema12 && crypto.ema26 ? crypto.ema12 > crypto.ema26 : false;
    
    return hasHighVolume && hasSignificantChange && hasRsiMomentum && isUptrend;
  });
};