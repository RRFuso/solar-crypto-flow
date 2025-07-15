import { useState, useEffect, useMemo } from 'react';
import { useCryptoData } from './useCryptoData';
import { CryptoData } from '@/types/crypto';

interface ExplosiveCrypto {
  symbol: string;
  factors: string[];
}

export const useExplosiveCryptos = () => {
  const { data: cryptos, isLoading, error } = useCryptoData();

  const explosiveCryptos = useMemo(() => {
    if (isLoading || error || !cryptos) return [];

    return cryptos.filter(crypto => {
      // Example criteria for explosive potential:
      // - Significant 24h price change (e.g., > 10%)
      // - High 24h volume (e.g., > $50M)
      // - RSI not overbought (e.g., < 70)
      const isExplosive = 
        crypto.change24h > 10 && 
        crypto.volume24h > 50_000_000 && 
        (crypto.rsi || 0) < 70;

      if (isExplosive) {
        const factors: string[] = [];
        if (crypto.change24h > 10) factors.push('Price Surge (>10%)');
        if (crypto.volume24h > 50_000_000) factors.push('High Volume (>$50M)');
        if ((crypto.rsi || 0) < 70) factors.push('RSI Not Overbought');
        
        return { symbol: crypto.symbol, factors };
      }
      return null;
    }).filter((item): item is ExplosiveCrypto => item !== null);
  }, [cryptos, isLoading, error]);

  return { explosiveCryptos, loading: isLoading };
};