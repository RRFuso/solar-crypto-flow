import { calculateEMA } from './ema';

export const calculateMACD = (prices: number[]): { macd: number[], signal: number[], histogram: number[] } => {
  if (prices.length < 26) {
    return { macd: [0], signal: [0], histogram: [0] };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  // Align by price index: ema12[i] is the EMA at price index i + 11,
  // ema26[i] at i + 25. The MACD line is defined from price index 25 on,
  // so ema12 must be offset by (26 - 12) entries to match ema26.
  const offset = 26 - 12;
  const macdLine = ema26.map((value, index) => ema12[index + offset] - value);

  // The signal line starts at macdLine index 8, so the histogram must
  // be offset by (9 - 1) entries to stay aligned by price index.
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = signalLine.map((value, index) => macdLine[index + 8] - value);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
};
