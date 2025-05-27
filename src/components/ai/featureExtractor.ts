import { FlowData } from '@/types/crypto';
import { CryptoAsset } from '@/types/crypto';

interface FeatureVector {
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
}

export async function extractFeatures(
  cryptos: CryptoAsset[],
  flowData: FlowData[],
  timeframe: string
): Promise<FeatureVector[]> {
  return cryptos.map((crypto) => {
    const flowsTo = flowData.filter(f => f.to === crypto.symbol);
    const flowsFrom = flowData.filter(f => f.from === crypto.symbol);
    const totalIn = flowsTo.reduce((acc, f) => acc + f.amount, 0);
    const totalOut = flowsFrom.reduce((acc, f) => acc + f.amount, 0);
    const net = totalIn - totalOut;

    return {
      symbol: crypto.symbol,
      id: crypto.name,
      price: crypto.price ?? 0,
      rsi: crypto.rsi ?? 50,
      rsi4h: crypto.rsi4h ?? 50,
      macd: crypto.macd ?? 0,
      macdSignal: crypto.macdSignal ?? 0,
      macdHistogram: crypto.macdHistogram ?? 0,
      aboveMA: !!crypto.aboveMA,
      priceChange1h: crypto.priceChange1h ?? 0,
      priceChange24h: crypto.priceChange24h ?? 0,
      volumeChange24h: crypto.volumeChange24h ?? 0,
      obv: crypto.obv ?? 0,
      netFlowPercentage: totalIn + totalOut > 0 ? (net / (totalIn + totalOut)) * 100 : 0,
      incomingFlows: totalIn,
      outgoingFlows: totalOut,
      exchangeInflow: crypto.exchangeInflow ?? 0,
      exchangeOutflow: crypto.exchangeOutflow ?? 0,
    };
  });
}

export function normalizeFeatures(features: FeatureVector[]): FeatureVector[] {
  return features.map((f) => ({
    ...f,
    rsi: clamp(f.rsi, 0, 100),
    rsi4h: clamp(f.rsi4h, 0, 100),
    macd: f.macd,
    macdSignal: f.macdSignal,
    macdHistogram: f.macdHistogram,
    aboveMA: !!f.aboveMA,
    priceChange1h: f.priceChange1h,
    priceChange24h: f.priceChange24h,
    volumeChange24h: Math.max(f.volumeChange24h, 0),
    obv: f.obv,
    netFlowPercentage: f.netFlowPercentage,
    incomingFlows: f.incomingFlows,
    outgoingFlows: f.outgoingFlows,
    exchangeInflow: f.exchangeInflow,
    exchangeOutflow: f.exchangeOutflow,
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
