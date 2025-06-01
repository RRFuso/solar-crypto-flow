import { CryptoData } from '@/types/crypto';

interface NormalizedFeature {
  symbol: string;
  id: string;
  price: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  aboveMA: boolean;
  priceChange1h: number;
  priceChange24h: number;
  volumeChange24h: number;
  obv: number;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  divergenceBullish: boolean;
  divergenceBearish: boolean;
}

export function normalizeFeatures(data: CryptoData[]): NormalizedFeature[] {
  return data.map((item) => {
    const rsi = item.indicators?.rsi ?? 50;
    const rsi4h = item.indicators?.rsi4h ?? 50;
    const macd = item.indicators?.macd ?? 0;
    const macdSignal = item.indicators?.macdSignal ?? 0;
    const macdHistogram = macd - macdSignal;

    const price = item.price ?? 0;
    const priceChange1h = item.priceChange1h ?? 0;
    const priceChange24h = item.priceChange24h ?? 0;
    const volumeChange24h = item.volumeChange24h ?? 0;
    const obv = item.obv ?? 0;

    const aboveMA = (item.indicators?.ma ?? price) < price;

    const incomingFlows = item.incomingFlows ?? 0;
    const outgoingFlows = item.outgoingFlows ?? 0;
    const exchangeInflow = item.exchangeInflow ?? 0;
    const exchangeOutflow = item.exchangeOutflow ?? 0;

    const netFlow = incomingFlows - outgoingFlows;
    const totalFlow = incomingFlows + outgoingFlows || 1;
    const netFlowPercentage = (netFlow / totalFlow) * 100;

    // Detectar divergência bullish (RSI sobe, preço cai, OBV sobe)
    const divergenceBullish = 
      priceChange1h < 0 &&
      rsi > 50 &&
      obv > 0 &&
      macdHistogram > 0;

    // Detectar divergência bearish (RSI cai, preço sobe, OBV negativo)
    const divergenceBearish = 
      priceChange1h > 0 &&
      rsi < 50 &&
      obv < 0 &&
      macdHistogram < 0;

    return {
      symbol: item.symbol,
      id: item.id,
      price,
      rsi,
      rsi4h,
      macd,
      macdSignal,
      macdHistogram,
      aboveMA,
      priceChange1h,
      priceChange24h,
      volumeChange24h,
      obv,
      netFlowPercentage,
      incomingFlows,
      outgoingFlows,
      exchangeInflow,
      exchangeOutflow,
      divergenceBullish,
      divergenceBearish,
    };
  });
}
