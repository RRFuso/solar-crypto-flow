
import { CryptoData } from '@/types/crypto';

// Cálculo de média simples
const sma = (arr: number[], period: number): number => {
  if (arr.length < period) return arr[arr.length - 1] || 0; 
  return arr.slice(-period).reduce((sum, val) => sum + val, 0) / period;
};

// Cálculo de desvio padrão
const std = (arr: number[]): number => {
  const mean = sma(arr, arr.length);
  return Math.sqrt(sma(arr.map(x => (x - mean) ** 2), arr.length));
};

// Divergência entre RSI e Preço
const computeDivergence = (prices: number[], rsis: number[]): { bull: boolean; bear: boolean } => {
  if (prices.length < 3 || rsis.length < 3) return { bull: false, bear: false };
  const priceTrend = prices[prices.length - 1] - prices[0];
  const rsiTrend = rsis[rsis.length - 1] - rsis[0];
  return {
    bull: priceTrend < 0 && rsiTrend > 0,
    bear: priceTrend > 0 && rsiTrend < 0
  };
};

// Detecta lateralização por baixa variação e volume alto
const computeLateralization = (prices: number[], volume: number[]): number => {
  const volatility = std(prices) / (sma(prices, prices.length) || 1);
  const volAvg = sma(volume, volume.length);
  if (volatility < 0.015 && volAvg > 0) return 1;
  return 0;
};

export function extractFeatures(data: CryptoData[]): any[] {
  return data.map((d) => {
    const priceHistory = d.history?.price || [];
    const rsiHistory = d.history?.rsi || [];
    const volumeHistory = d.history?.volume || [];
    const obvHistory = d.history?.obv || [];

    const price = d.price || priceHistory[priceHistory.length - 1] || 0;
    const rsi = d.rsi || rsiHistory[rsiHistory.length - 1] || 50;
    const obv = d.obv || obvHistory[obvHistory.length - 1] || 0;

    const divergence = computeDivergence(priceHistory, rsiHistory);
    const lateralScore = computeLateralization(priceHistory, volumeHistory);

    const flowStrength = d.incomingFlows - d.outgoingFlows;
    const netFlowPct = (flowStrength / (d.volume || 1)) * 100;

    return {
      symbol: d.symbol,
      id: d.id,
      price,
      rsi,
      obv,
      macd: d.macd,
      macdSignal: d.macdSignal,
      macdHistogram: d.macdHistogram,
      aboveMA: d.aboveMA,
      priceChange1h: d.priceChange1h,
      priceChange24h: d.priceChange24h,
      volumeChange24h: d.volumeChange24h,
      exchangeInflow: d.exchangeInflow,
      exchangeOutflow: d.exchangeOutflow,
      incomingFlows: d.incomingFlows,
      outgoingFlows: d.outgoingFlows,
      netFlowPercentage: netFlowPct,
      divergenceBullish: divergence.bull,
      divergenceBearish: divergence.bear,
      lateralizationScore: lateralScore,
      timestamp: Date.now()
    };
  });
}
