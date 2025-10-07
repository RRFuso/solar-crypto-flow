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

    const explosiveResults: ExplosiveCrypto[] = [];
    
    cryptos.forEach(crypto => {
      // More aggressive criteria to catch explosive movers
      const priceChange24h = crypto.change24h || crypto.priceChange24h || 0;
      const priceChange1h = crypto.priceChange1h || 0;
      const volume = crypto.volume24h || crypto.volume || 0;
      
      // Lowered thresholds to capture more opportunities
      const isExplosive = 
        (priceChange24h > 8 || priceChange1h > 3) && 
        volume > 10_000_000 && // Reduced from 50M
        (crypto.rsi || 50) < 75; // More permissive RSI

      if (isExplosive) {
        const factors: string[] = [];
        if (priceChange24h > 15) factors.push('Spike Massivo (>15%)');
        else if (priceChange24h > 10) factors.push('Alta Forte (>10%)');
        else if (priceChange24h > 8) factors.push('Alta (>8%)');
        if (priceChange1h > 3) factors.push('Explosão 1h');
        if (volume > 50_000_000) factors.push('Volume Alto');
        else if (volume > 10_000_000) factors.push('Volume Significativo');
        if ((crypto.rsi || 50) < 70) factors.push('RSI Favorável');
        
        explosiveResults.push({ symbol: crypto.symbol, factors });
      }
    });
    
    return explosiveResults;
  }, [cryptos, isLoading, error]);

  return { explosiveCryptos, loading: isLoading };
};