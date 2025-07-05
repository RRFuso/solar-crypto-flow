
import { HistoricalDataPoint } from '@/types/crypto';

// Inferred interfaces based on usage in the project
export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  category?: string;
  rsi?: number;
  rsi_4h?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  obv?: number;
}

export interface FlowData {
  from: string;
  to: string;
  amount: number;
}

export interface CryptoFeatures {
  symbol: string;
  id: string;
  price: number;
  volume: number;
  rsi: number;
  rsi4h: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  obv: number;
  aboveMA: boolean;
  priceChange1h: number;
  priceChange24h: number;
  volumeChange24h: number;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
}

/**
 * Extracts and calculates features for a given set of cryptocurrencies.
 */
export async function extractFeatures(
  cryptos: CryptoData[],
  flows: FlowData[],
  timeframe: string
): Promise<CryptoFeatures[]> {
  const features: CryptoFeatures[] = [];

  for (const crypto of cryptos) {
    const incomingFlows = flows.filter(f => f.to === crypto.symbol).reduce((sum, f) => sum + f.amount, 0);
    const outgoingFlows = flows.filter(f => f.from === crypto.symbol).reduce((sum, f) => sum + f.amount, 0);
    const totalFlow = incomingFlows + outgoingFlows;
    const netFlowPercentage = totalFlow > 0 ? ((incomingFlows - outgoingFlows) / totalFlow) * 100 : 0;

    // Simplified moving average calculation from sparkline
    const prices7d = crypto.sparkline_in_7d?.price || [];
    const ma7 = prices7d.length > 0 ? prices7d.reduce((a, b) => a + b, 0) / prices7d.length : 0;

    features.push({
      symbol: crypto.symbol,
      id: crypto.id,
      price: crypto.price || 0,
      volume: crypto.total_volume || 0,
      rsi: crypto.rsi || 50,
      rsi4h: crypto.rsi_4h || 50,
      macd: crypto.macd || 0,
      macdSignal: crypto.macd_signal || 0,
      macdHistogram: crypto.macd_hist || 0,
      obv: crypto.obv || 0,
      aboveMA: crypto.price > ma7,
      priceChange1h: crypto.price_change_percentage_1h_in_currency || 0,
      priceChange24h: crypto.price_change_percentage_24h_in_currency || 0,
      volumeChange24h: 0, // Placeholder, as this data isn't directly available
      netFlowPercentage,
      incomingFlows,
      outgoingFlows,
      exchangeInflow: 0, // Placeholder
      exchangeOutflow: 0, // Placeholder
    });
  }
  return features;
}

/**
 * Normalizes features to a common scale (e.g., 0-1).
 * This is a placeholder implementation. A real implementation would use min-max scaling or z-score standardization.
 */
export function normalizeFeatures(features: CryptoFeatures[]): CryptoFeatures[] {
  // For now, we'll just return the features as is.
  // A real implementation would require calculating min/max for each feature across the dataset.
  return features;
}


/**
 * Calculates Bollinger Bands.
 * @param data - Array of historical data points.
 * @param period - The period to calculate the bands over (e.g., 20).
 * @returns An array of objects containing the moving average, upper band, and lower band.
 */
const calculateBollingerBands = (data: number[], period: number) => {
  const results: { ma: number; upper: number; lower: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const ma = slice.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(slice.map(x => Math.pow(x - ma, 2)).reduce((a, b) => a + b, 0) / period);
    results.push({
      ma,
      upper: ma + stdDev * 2,
      lower: ma - stdDev * 2,
    });
  }
  return results;
};

/**
 * Calculates Volatility Compression using Bollinger Band Width.
 * A value closer to 1 indicates higher compression (tighter bands).
 * @param historicalData - Array of historical OHLCV data points.
 * @param period - The period for Bollinger Bands calculation (default 20).
 * @returns A score from 0 to 1.
 */
export const calculateVolatilityCompression = (historicalData: HistoricalDataPoint[], period: number = 20): number => {
  if (historicalData.length < period) return 0;

  const closePrices = historicalData.map(d => d.close);
  const bands = calculateBollingerBands(closePrices, period);
  if (bands.length === 0) return 0;

  const lastBand = bands[bands.length - 1];
  const bandwidth = (lastBand.upper - lastBand.lower) / lastBand.ma;

  // Normalize the bandwidth. Lower is better.
  // This is a heuristic normalization. A bandwidth of 0.05 (5%) is considered very tight.
  const normalizedScore = 1 - Math.min(1, bandwidth / 0.25);
  return Math.max(0, Math.min(1, normalizedScore)); // Clamp between 0 and 1
};

/**
 * Detects a recent volume spike compared to a moving average.
 * @param historicalData - Array of historical OHLCV data points.
 * @param lookback - The number of recent periods to check for a spike (default 3).
 * @param smaPeriod - The period for the simple moving average of volume (default 30).
 * @returns A score from 0 to 1 indicating the significance of the spike.
 */
export const detectVolumeSpike = (historicalData: HistoricalDataPoint[], lookback: number = 3, smaPeriod: number = 30): number => {
  if (historicalData.length < smaPeriod + lookback) return 0;

  const volumes = historicalData.map(d => d.volume || 0);
  const recentVolumes = volumes.slice(-lookback);
  const averageVolume = volumes.slice(-smaPeriod, -lookback).reduce((a, b) => a + b, 0) / (smaPeriod - lookback);

  if (averageVolume === 0) return 0;

  const maxRecentVolume = Math.max(...recentVolumes);
  const spikeRatio = maxRecentVolume / averageVolume;

  // Normalize the ratio. A spike 3x the average is significant.
  const normalizedScore = Math.min(1, (spikeRatio - 1) / 3);
  return Math.max(0, Math.min(1, normalizedScore)); // Clamp between 0 and 1
};
