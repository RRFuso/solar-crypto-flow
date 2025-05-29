import { CryptoData } from '@/types/crypto';

export interface FeatureVector {
  symbol: string;
  id: string;
  price: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  obv: number;
  volumeChange24h: number;
  priceChange1h: number;
  priceChange24h: number;
  aboveMA: boolean;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  divergenceBullish: boolean;
  divergenceBearish: boolean;
}

export function extractFeatures(data: CryptoData[]): FeatureVector[] {
  return data.map(coin => {
    const netFlow = coin.incomingFlows - coin.outgoingFlows;
    const netFlowPercentage = coin.marketCap > 0 ? (netFlow / coin.marketCap) * 100 : 0;
    const aboveMA = coin.price > coin.movingAverage;

    // Divergência com base em preço subindo e volume caindo (bearish), ou preço caindo e volume subindo (bullish)
    const divergenceBullish = coin.priceChange24h < 0 && coin.volumeChange24h > 10;
    const divergenceBearish = coin.priceChange24h > 0 && coin.volumeChange24h < -10;

    return {
      symbol: coin.symbol,
      id: coin.id,
      price: coin.price,
      rsi: coin.rsi,
      rsi4h: coin.rsi4h || coin.rsi, // fallback
      macd: coin.macd,
      macdSignal: coin.macdSignal,
      macdHistogram: coin.macdHistogram,
      obv: coin.obv,
      volumeChange24h: coin.volumeChange24h,
      priceChange1h: coin.priceChange1h,
      priceChange24h: coin.priceChange24h,
      aboveMA,
      netFlowPercentage,
      incomingFlows: coin.incomingFlows,
      outgoingFlows: coin.outgoingFlows,
      exchangeInflow: coin.exchangeInflow,
      exchangeOutflow: coin.exchangeOutflow,
      divergenceBullish,
      divergenceBearish
    };
  });
}

export function normalizeFeatures(features: FeatureVector[]): FeatureVector[] {
  // Pode-se aplicar normalização min-max se desejar.
  return features.map(f => ({ ...f }));
}
