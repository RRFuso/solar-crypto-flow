
import { useMemo } from 'react';
import { CryptoData } from '@/types/crypto';

export const useDivergenciaBull = (cryptos: CryptoData[]) => {
  return useMemo(() => {
    return cryptos
      .filter(crypto => {
        // Uma divergência bullish ocorre quando o preço faz mínimas mais baixas,
        // mas o indicador (RSI) faz mínimas mais altas
        if (!crypto.rsi || !crypto.macd) return false;
        
        const hasRsiDivergence = crypto.rsi > 30 && crypto.rsi < 50 && 
                                crypto.priceChange1h && crypto.priceChange1h < 0 &&
                                crypto.macd.histogram > 0;
        
        return hasRsiDivergence;
      })
      .map(crypto => ({
        ...crypto,
        criteriaHit: ['Divergência RSI Bull'],
        isExplosive: true
      }))
      .sort((a, b) => (b.rsi || 0) - (a.rsi || 0));
  }, [cryptos]);
};
