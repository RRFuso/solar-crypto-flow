
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

/**
 * Extracts feature vectors from raw crypto data and flow data
 */
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

      const incomingFlows = flowData
        .filter(flow => flow.to === crypto.symbol && flow.value > 0)
        .reduce((sum, flow) => sum + flow.value, 0);

      const outgoingFlows = flowData
        .filter(flow => flow.from === crypto.symbol && flow.value < 0)
        .reduce((sum, flow) => sum + Math.abs(flow.value), 0);

      const netFlowPercentage =
        crypto.marketCap > 0
          ? ((incomingFlows - outgoingFlows) / crypto.marketCap) * 100
          : 0;

      features.push({
        symbol: crypto.symbol || "",
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
        incomingFlows,
        outgoingFlows,
        netFlowPercentage,
        category: crypto.category || "other",
        price: crypto.price || "0"
      });
    } catch (err) {
      console.error(`Erro ao extrair dados de ${crypto.symbol}:`, err);
    }
  }

  return features;
}

/**
 * Normalizes numeric fields between a defined range
 */
export function normalizeFeatures(
  features: CryptoFeatures[],
  minVal: number = -1,
  maxVal: number = 1
): CryptoFeatures[] {
  if (features.length === 0) return [];

  const numericFields = [
    'priceChange1h', 'priceChange24h', 'priceChange7d',
    'volume', 'volumeChange24h', 'marketCap',
    'rsi', 'rsi4h', 'macd', 'macdSignal', 'macdHistogram',
    'ema12', 'ema26', 'obv',
    'exchangeInflow', 'exchangeOutflow', 'netFlow', 'fundingRate',
    'incomingFlows', 'outgoingFlows', 'netFlowPercentage'
  ] as const;

  type NumericField = typeof numericFields[number];

  const mins: Record<NumericField, number> = {} as any;
  const maxs: Record<NumericField, number> = {} as any;

  numericFields.forEach(field => {
    mins[field] = features[0][field];
    maxs[field] = features[0][field];
  });

  for (const feature of features) {
    for (const field of numericFields) {
      const val = feature[field];
      if (val < mins[field]) mins[field] = val;
      if (val > maxs[field]) maxs[field] = val;
    }
  }

  return features.map(feature => {
    const normalized = { ...feature };

    for (const field of numericFields) {
      const val = feature[field];
      const min = mins[field];
      const max = maxs[field];

      if (max === min) {
        normalized[field] = 0;
      } else {
        normalized[field] = minVal + ((val - min) / (max - min)) * (maxVal - minVal);
      }
    }

    return normalized;
  });
}
