
import { useMemo } from 'react';
import { CryptoData } from '@/types/crypto';

export const useDivergenciaBear = (cryptos: CryptoData[]) => {
  return useMemo(() => {
    console.log('useDivergenciaBear: Processing', cryptos.length, 'cryptos');
    const filtered = cryptos
      .filter(crypto => {
        // Lógica simplificada para divergência bearish:
        // RSI em sobrecompra (acima de 70) E
        // Preço recente mostrando queda (priceChange1h negativo) E
        // Histograma MACD negativo ou virando negativo
        if (!crypto.rsi || !crypto.macd || !crypto.priceChange1h) {
          return false;
        }

        const isRsiOverbought = crypto.rsi > 70;
        const isPriceFalling = crypto.priceChange1h < 0;
        const isMacdBearish = crypto.macd.histogram < 0; // ou crypto.macd.histogram < crypto.macd.histogramPrev (se tivéssemos histórico)

        const hasBearishDivergencePotential = isRsiOverbought && isPriceFalling && isMacdBearish;

        if (hasBearishDivergencePotential) {
          console.log(`Bearish Divergence Potential for ${crypto.symbol}: RSI=${crypto.rsi.toFixed(2)}, PriceChange1h=${crypto.priceChange1h.toFixed(2)}%, MACD Hist=${crypto.macd.histogram.toFixed(2)}`);
        }

        return hasBearishDivergencePotential;
      })
      .map(crypto => ({
        ...crypto,
        criteriaHit: ['Divergência RSI Bear'],
        isExplosive: true,
        score: 10 // Adding required score property with default value
      }))
      .sort((a, b) => (b.priceChange1h || 0) - (a.priceChange1h || 0));

    console.log('useDivergenciaBear: Found', filtered.length, 'cryptos with potential bearish divergence');
    return filtered;
  }, [cryptos]);
};
