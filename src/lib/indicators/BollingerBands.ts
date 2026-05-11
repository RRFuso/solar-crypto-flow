export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
  isSqueeze: boolean;
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  percentB: number;
}

export class BollingerBands {
  /**
   * Calcula Bollinger Bands com squeeze detection.
   * Squeeze = bandas comprimidas (baixa volatilidade), geralmente precede movimento forte.
   */
  static calculate(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): BollingerBandsResult {
    if (prices.length < period) {
      throw new Error('Not enough data');
    }

    const sma = this.calculateSMA(prices, period);
    const std = this.calculateStdDev(prices, period);

    const upper = sma.map((val, i) => val + std[i] * stdDev);
    const lower = sma.map((val, i) => val - std[i] * stdDev);

    const bandwidth = upper.map((u, i) => ((u - lower[i]) / sma[i]) * 100);

    const window = bandwidth.slice(-50);
    const avgBandwidth = window.reduce((a, b) => a + b, 0) / window.length;
    const currentBandwidth = bandwidth[bandwidth.length - 1];
    const isSqueeze = currentBandwidth < avgBandwidth * 0.7;

    const currentPrice = prices[prices.length - 1];
    const currentUpper = upper[upper.length - 1];
    const currentLower = lower[lower.length - 1];

    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let confidence = 0;

    if (currentPrice > currentUpper && isSqueeze) {
      signal = 'buy';
      confidence = 0.8;
    } else if (currentPrice < currentLower && isSqueeze) {
      signal = 'sell';
      confidence = 0.8;
    } else if (currentPrice < currentLower * 1.02) {
      signal = 'buy';
      confidence = 0.6;
    } else if (currentPrice > currentUpper * 0.98) {
      signal = 'sell';
      confidence = 0.6;
    }

    const percentB =
      ((currentPrice - currentLower) / (currentUpper - currentLower)) * 100;

    return {
      upper,
      middle: sma,
      lower,
      bandwidth,
      isSqueeze,
      signal,
      confidence,
      percentB,
    };
  }

  private static calculateSMA(prices: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  private static calculateStdDev(prices: number[], period: number): number[] {
    const result: number[] = [];
    const sma = this.calculateSMA(prices, period);
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const squaredDiffs = slice.map((p) => Math.pow(p - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      result.push(Math.sqrt(variance));
    }
    return result;
  }
}
