
import { useMemo } from 'react';
import { CryptoData } from '@/types/crypto';

export const useDivergenciaBull = (cryptos: CryptoData[]) => {
  return useMemo(() => {
    console.log('useDivergenciaBull: Processing', cryptos.length, 'cryptos');
    const filtered = cryptos
      .filter(crypto => {
        // Lógica simplificada para divergência bullish:
        // RSI em sobrevenda (abaixo de 30) E
        // Preço recente mostrando recuperação (priceChange1h positivo) E
        // Histograma MACD positivo ou virando positivo
        if (!crypto.rsi || !crypto.macd || !crypto.priceChange1h) {
          return false;
        }
        
        const isRsiOversold = crypto.rsi < 30;
        const isPriceRecovering = crypto.priceChange1h > 0;
        const isMacdBullish = crypto.macd.histogram > 0; // ou crypto.macd.histogram > crypto.macd.histogramPrev (se tivéssemos histórico)

        const hasBullishDivergencePotential = isRsiOversold && isPriceRecovering && isMacdBullish;
        
        if (hasBullishDivergencePotential) {
          console.log(`Bullish Divergence Potential for ${crypto.symbol}: RSI=${crypto.rsi.toFixed(2)}, PriceChange1h=${crypto.priceChange1h.toFixed(2)}%, MACD Hist=${crypto.macd.histogram.toFixed(2)}`);
        }

        return hasBullishDivergencePotential;
      })
      .map(crypto => ({
        ...crypto,
        criteriaHit: ['Divergência RSI Bull'],
        isExplosive: true,
        score: 10 // Adding required score property with default value
      }))
      .sort((a, b) => (b.rsi || 0) - (a.rsi || 0));

    console.log('useDivergenciaBull: Found', filtered.length, 'cryptos with potential bullish divergence');
    return filtered;
  }, [cryptos]);
};
