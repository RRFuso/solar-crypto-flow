import { HistoricalDataPoint } from '@src/types/crypto';

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

/**
 * Calculates the On-Balance Volume (OBV) trend.
 * @param historicalData - Array of historical OHLCV data points.
 * @returns A score from -1 to 1 indicating the OBV trend.
 */
export const calculateOBVTrend = (historicalData: HistoricalDataPoint[]): number => {
  if (historicalData.length < 2) return 0;

  let obv = 0;
  const obvValues: number[] = [];

  for (let i = 1; i < historicalData.length; i++) {
    const current = historicalData[i];
    const previous = historicalData[i - 1];
    if (current.close > previous.close) {
      obv += current.volume || 0;
    } else if (current.close < previous.close) {
      obv -= current.volume || 0;
    }
    obvValues.push(obv);
  }

  if (obvValues.length < 14) return 0; // Need enough data for a trend

  // Simple trend detection: compare the recent OBV average to the longer-term average
  const recentAvg = obvValues.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const longTermAvg = obvValues.slice(-14).reduce((a, b) => a + b, 0) / 14;

  if (longTermAvg === 0) return 0;

  const trendStrength = (recentAvg - longTermAvg) / Math.abs(longTermAvg);
  return Math.max(-1, Math.min(1, trendStrength)); // Clamp between -1 and 1
};

/**
 * Calculates the Relative Strength Index (RSI).
 * @param data - Array of numbers (e.g., closing prices).
 * @param period - The period for RSI calculation (default 14).
 * @returns The latest RSI value.
 */
export const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length < period) return 50; // Default to neutral if not enough data

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Subsequent calculations
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100; // Avoid division by zero

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export interface CryptoFeatures {
  symbol: string;
  id: string;
  price: number;
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
  obv: number;
  aboveMA: boolean;
  netFlowPercentage: number;
  incomingFlows: number;
  outgoingFlows: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  volatilityCompression: number;
  volumeSpike: number;
  obvTrend: number;
}

export function extractFeatures(crypto: any, historicalData: HistoricalDataPoint[] = []): CryptoFeatures {
  const closePrices = historicalData.map(d => d.close);
  const rsi = historicalData.length > 14 ? calculateRSI(closePrices, 14) : 50;
  // Assume 4h data is not readily available, use 24h as a proxy or default
  const rsi4h = rsi; 

  // Placeholder for MACD, as it's more complex
  const macd = crypto.macd?.value || 0;
  const macdSignal = crypto.macd?.signal || 0;
  const macdHistogram = crypto.macd?.histogram || 0;

  // Placeholder for OBV, requires historical data
  const obv = historicalData.length > 1 ? calculateOBVTrend(historicalData) : 0;

  // Placeholder for Moving Average
  const aboveMA = crypto.aboveMA14 || false;

  // Flow metrics (placeholders, assuming they come from another source)
  const netFlowPercentage = crypto.netFlowPercentage || 0;
  const incomingFlows = crypto.incomingFlows || 0;
  const outgoingFlows = crypto.outgoingFlows || 0;
  const exchangeInflow = crypto.exchangeInflow || 0;
  const exchangeOutflow = crypto.exchangeOutflow || 0;

  // New explosive indicators
  const volatilityCompression = calculateVolatilityCompression(historicalData);
  const volumeSpike = detectVolumeSpike(historicalData);
  const obvTrend = calculateOBVTrend(historicalData);

  return {
    symbol: crypto.symbol,
    id: crypto.id,
    price: parseFloat(crypto.price) || 0,
    priceChange1h: crypto.priceChange1h || 0,
    priceChange24h: crypto.priceChange24h || 0,
    priceChange7d: crypto.priceChange7d || 0,
    volume: parseFloat(crypto.volume) || 0,
    volumeChange24h: crypto.volumeChange24h || 0,
    marketCap: crypto.marketCap || 0,
    rsi,
    rsi4h,
    macd,
    macdSignal,
    macdHistogram,
    obv,
    aboveMA,
    netFlowPercentage,
    incomingFlows,
    outgoingFlows,
    exchangeInflow,
    exchangeOutflow,
    volatilityCompression,
    volumeSpike,
    obvTrend,
  };
}

export function normalizeFeatures(features: CryptoFeatures[]): CryptoFeatures[] {
  const maxValues: { [key: string]: number } = {
    price: 0,
    priceChange1h: 0,
    priceChange24h: 0,
    priceChange7d: 0,
    volume: 0,
    volumeChange24h: 0,
    marketCap: 0,
    rsi: 100,
    rsi4h: 100,
    macd: 0,
    macdSignal: 0,
    macdHistogram: 0,
    obv: 0,
    netFlowPercentage: 0,
    incomingFlows: 0,
    outgoingFlows: 0,
    exchangeInflow: 0,
    exchangeOutflow: 0,
  };

  for (const f of features) {
    for (const key in maxValues) {
      if (key !== 'rsi' && key !== 'rsi4h') {
        maxValues[key] = Math.max(maxValues[key], Math.abs(f[key as keyof CryptoFeatures] as number));
      }
    }
  }

  return features.map(f => {
    const normalized: any = { ...f };
    for (const key in maxValues) {
      if (maxValues[key] > 0) {
        normalized[key] = (f[key as keyof CryptoFeatures] as number) / maxValues[key];
      }
    }
    return normalized as CryptoFeatures;
  });
}
