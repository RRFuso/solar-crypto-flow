import { HistoricalDataPoint } from '@/types/crypto';

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