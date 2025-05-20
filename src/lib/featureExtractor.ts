import { CryptoData, FlowData } from "@/types/crypto";
import { fetchTechnicalIndicators, fetchOnChainData } from "./dataFetcher";

export interface CryptoFeatures {
  symbol: string;
  id: string;
  price: string;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volume: number;
  volumeChange24h: number;
  marketCap: number;

  // Indicadores técnicos
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema12: number;
  ema26: number;
  aboveMA: boolean;
  obv: number;

  // Fluxo de capital
  exchangeInflow: number;
  exchangeOutflow: number;
  netFlow: number;
  fundingRate: number;
  incomingFlows: number;
  outgoingFlows: number;
  netFlowPercentage: number;

  // Estratégias avançadas
  hasBullishDivergence?: boolean;
  hasBearishDivergence?: boolean;
  volumeSpikeWithLowRSI?: boolean;
  supportLevelTested?: boolean;
  resistanceLevelTested?: boolean;

  category: string;
}

/**
 * Extração de features incluindo volume x RSI, divergências e suportes/resistências
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
        .filter(f => f.to === crypto.symbol && f.value > 0)
        .reduce((sum, f) => sum + f.value, 0);

      const outgoingFlows = flowData
        .filter(f => f.from === crypto.symbol && f.value < 0)
        .reduce((sum, f) => sum + Math.abs(f.value), 0);

      const netFlowPercentage = crypto.marketCap > 0
        ? ((incomingFlows - outgoingFlows) / crypto.marketCap) * 100
        : 0;

      const priceNow = parseFloat(crypto.price || "0");

      // 📊 Estratégias avançadas
      const hasBullishDivergence =
        technical.rsi < 40 && crypto.priceChange1h < 0 && technical.macdHistogram > 0;

      const hasBearishDivergence =
        technical.rsi > 60 && crypto.priceChange1h > 0 && technical.macdHistogram < 0;

      const volumeSpikeWithLowRSI =
        crypto.volumeChange24h > 20 && technical.rsi < 30;

      const supportLevelTested =
        technical.ema12 < technical.ema26 &&
        Math.abs(priceNow - technical.ema26) / priceNow < 0.01;

      const resistanceLevelTested =
        technical.ema12 > technical.ema26 &&
        Math.abs(priceNow - technical.ema12) / priceNow < 0.01;

      features.push({
        symbol: crypto.symbol || "",
        id: crypto.id,
        price: crypto.price || "0",
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

        hasBullishDivergence,
        hasBearishDivergence,
        volumeSpikeWithLowRSI,
        supportLevelTested,
        resistanceLevelTested,

        category: crypto.category || "other"
      });

    } catch (err) {
      console.error(`Erro ao extrair features para ${crypto.symbol}:`, err);
    }
  }

  return features;
}

/**
 * Normalização de features numéricas
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

  features.forEach(feature => {
    numericFields.forEach(field => {
      const val = feature[field];
      if (val < mins[field]) mins[field] = val;
      if (val > maxs[field]) maxs[field] = val;
    });
  });

  return features.map(f => {
    const norm = { ...f };
    numericFields.forEach(field => {
      const val = f[field];
      const min = mins[field];
      const max = maxs[field];
      if (max === min) {
        norm[field] = 0;
      } else {
        norm[field] = minVal + ((val - min) / (max - min)) * (maxVal - minVal);
      }
    });
    return norm;
  });
}
