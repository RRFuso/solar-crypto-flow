import { CryptoData, FlowData } from "@/types/crypto";
import { fetchTechnicalIndicators, fetchOnChainData } from "./dataFetcher";

export interface CryptoFeatures {
  symbol: string;
  id: string;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volume: number;
  volumeChange24h: number;
  marketCap: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema12: number;
  ema26: number;
  aboveMA: boolean;
  obv: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  netFlow: number;
  fundingRate: number;
  incomingFlows: number;
  outgoingFlows: number;
  netFlowPercentage: number;
  category: string;
  price: string;
}

export async function extractFeatures(
  cryptoData: CryptoData[],
  flowData: FlowData[],
  chartTimeframe: string = '4h'
): Promise<CryptoFeatures[]> {
  const features: CryptoFeatures[] = [];

  for (const crypto of cryptoData) {
    try {
      const technical = await fetchTechnicalIndicators(crypto.symbol, chartTimeframe);
      const onChain = await fetchOnChainData(crypto.symbol);

      const incoming = flowData
        .filter(f => f.to === crypto.symbol && f.value > 0)
        .reduce((sum, f) => sum + f.value, 0);

      const outgoing = flowData
        .filter(f => f.from === crypto.symbol && f.value < 0)
        .reduce((sum, f) => sum + Math.abs(f.value), 0);

      const netFlowPct = crypto.marketCap > 0
        ? ((incoming - outgoing) / crypto.marketCap) * 100
        : 0;

      features.push({
        symbol: crypto.symbol,
        id: crypto.id,
        priceChange1h: crypto.priceChange1h || 0,
        priceChange24h: crypto.priceChange24h || 0,
        priceChange7d: crypto.priceChange7d || 0,
        volume: parseFloat(crypto.volume || "0"),
        volumeChange24h: crypto.volumeChange24h || 0,
        marketCap: crypto.marketCap || 0,
        rsi: technical.rsi,
        rsi4h: technical.rsi4h,
        macd: technical.macd.value,
        macdSignal: technical.macd.signal,
        macdHistogram: technical.macd.histogram,
        ema12: technical.ema12,
        ema26: technical.ema26,
        aboveMA: technical.ema12 > technical.ema26,
        obv: technical.obv,
        exchangeInflow: onChain.exchangeInflow,
        exchangeOutflow: onChain.exchangeOutflow,
        netFlow: onChain.netFlow,
        fundingRate: onChain.fundingRate,
        incomingFlows: incoming,
        outgoingFlows: outgoing,
        netFlowPercentage: netFlowPct,
        category: crypto.category || 'other',
        price: crypto.price || "0"
      });
    } catch (e) {
      console.error(`Erro ao extrair features de ${crypto.symbol}`, e);
    }
  }

  return features;
}

export function normalizeFeatures(features: CryptoFeatures[]): CryptoFeatures[] {
  if (features.length === 0) return [];

  const fields = [
    'priceChange1h', 'priceChange24h', 'priceChange7d',
    'volume', 'volumeChange24h', 'marketCap',
    'rsi', 'rsi4h', 'macd', 'macdSignal', 'macdHistogram',
    'ema12', 'ema26', 'obv',
    'exchangeInflow', 'exchangeOutflow', 'netFlow', 'fundingRate',
    'incomingFlows', 'outgoingFlows', 'netFlowPercentage'
  ] as const;

  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};

  fields.forEach(f => {
    mins[f] = Math.min(...features.map(ft => ft[f] ?? 0));
    maxs[f] = Math.max(...features.map(ft => ft[f] ?? 0));
  });

  return features.map(f => {
    const copy = { ...f };
    fields.forEach(field => {
      const min = mins[field];
      const max = maxs[field];
      copy[field] = max === min ? 0 : (f[field] - min) / (max - min);
    });
    return copy;
  });
}
