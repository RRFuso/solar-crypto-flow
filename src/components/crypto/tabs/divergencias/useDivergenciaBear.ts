
import { useMemo } from 'react';
import { CryptoData } from '@/types/crypto';

export const useDivergenciaBear = (cryptos: CryptoData[]) => {
  return useMemo(() => {
    return cryptos
      .filter(crypto => {
        // Uma divergência bearish ocorre quando o preço faz máximas mais altas,
        // mas o indicador (RSI) faz máximas mais baixas
        if (!crypto.rsi || !crypto.macd) return false;
        
        const hasRsiDivergence = crypto.rsi < 70 && crypto.rsi > 50 && 
                                crypto.priceChange1h && crypto.priceChange1h > 0 &&
                                crypto.macd.histogram < 0;
        
        return hasRsiDivergence;
      })
      .map(crypto => ({
        ...crypto,
        criteriaHit: ['Divergência RSI Bear'],
        isExplosive: true
      }))
      .sort((a, b) => (b.priceChange1h || 0) - (a.priceChange1h || 0));
  }, [cryptos]);
};
