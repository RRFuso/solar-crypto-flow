import { CryptoData } from '@/types/crypto';

/**
 * Função que calcula divergência bullish ou bearish com base em preço e OBV (On-Balance Volume)
 * @returns objeto com flags de divergência
 */
function calculateDivergences(data: CryptoData): { divergenceBullish: boolean, divergenceBearish: boolean } {
  // Exemplo simplificado: compara tendência do preço vs. OBV
  const priceChange = data.priceChange24h;
  const obvChange = data.obvChange24h || 0;

  const divergenceBullish = priceChange < 0 && obvChange > 0;
  const divergenceBearish = priceChange > 0 && obvChange < 0;

  return { divergenceBullish, divergenceBearish };
}

/**
 * Normaliza os dados crus das criptos e adiciona fatores derivados
 */
export function normalizeFeatures(rawFeatures: CryptoData[]) {
  return rawFeatures.map(data => {
    const { divergenceBullish, divergenceBearish } = calculateDivergences(data);

    return {
      ...data,
      symbol: data.symbol,
      id: data.symbol,
      aboveMA: data.price > (data.movingAverage || 0),
      netFlowPercentage: data.incomingFlows && data.outgoingFlows
        ? ((data.incomingFlows - data.outgoingFlows) / Math.max(data.marketCap || 1, 1)) * 100
        : 0,
      exchangeInflow: data.exchangeInflow || 0,
      exchangeOutflow: data.exchangeOutflow || 0,
      obv: data.obv || 0,
      obvChange24h: data.obvChange24h || 0,
      macdHistogram: data.macdHistogram || 0,
      volumeChange24h: data.volumeChange24h || 0,
      priceChange1h: data.priceChange1h || 0,
      priceChange24h: data.priceChange24h || 0,
      divergenceBullish,
      divergenceBearish,
    };
  });
}
