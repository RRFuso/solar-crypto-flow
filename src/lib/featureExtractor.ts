import { CryptoData } from '@/types/crypto';

export interface ExtractedFeatures {
  id: string;
  symbol: string;
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
  volumeAnomaly: number;
  obv: number;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  divergenceBullish: boolean;
  divergenceBearish: boolean;
  lateralizationBearish: boolean;
}

export function extractFeatures(data: CryptoData[]): ExtractedFeatures[] {
  return data.map((d) => {
    const price = d.price || 0;
    const rsi = d.rsi || 50;
    const rsi4h = d.rsi4h || 50;
    const macd = d.macd || 0;
    const macdSignal = d.macdSignal || 0;
    const macdHistogram = macd - macdSignal;

    const ma = d.movingAverage || price;
    const aboveMA = price > ma;

    const priceChange1h = d.priceChange1h || 0;
    const priceChange24h = d.priceChange24h || 0;

    const volumeNow = d.volume || 0;
    const volumeAvg = d.volumeAvg || volumeNow;
    const volumeChange24h = volumeNow && volumeAvg
      ? ((volumeNow - volumeAvg) / volumeAvg) * 100
      : 0;

    const volumeAnomaly = volumeAvg > 0 ? volumeNow / volumeAvg : 1;

    const obv = d.obv || 0;

    const inflow = d.exchangeInflow || 0;
    const outflow = d.exchangeOutflow || 0;
    const incomingFlows = d.incomingFlows || 0;
    const outgoingFlows = d.outgoingFlows || 0;

    const netFlow = inflow - outflow;
    const totalFlow = inflow + outflow || 1;
    const netFlowPercentage = (netFlow / totalFlow) * 100;

    // Detecta divergência bullish (RSI sobe, preço lateral ou cai levemente)
    const divergenceBullish = (
      rsi > 30 && rsi < 50 &&
      macdHistogram > 0 &&
      priceChange1h < 0 &&
      obv > 0
    );

    // Detecta divergência bearish (RSI cai, preço sobe ou lateral)
    const divergenceBearish = (
      rsi > 60 &&
      priceChange1h > 1 &&
      macdHistogram < 0 &&
      obv < 0
    );

    // Detecta lateralização com fluxo de saída (sinal bearish oculto)
    const lateralizationBearish = (
      Math.abs(priceChange1h) < 0.5 &&
      netFlowPercentage < -5 &&
      rsi > 55
    );

    return {
      id: d.id,
      symbol: d.symbol,
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
      volumeAnomaly,
      obv,
      netFlowPercentage,
      incomingFlows,
      outgoingFlows,
      exchangeInflow: inflow,
      exchangeOutflow: outflow,
      divergenceBullish,
      divergenceBearish,
      lateralizationBearish
    };
  });
}
