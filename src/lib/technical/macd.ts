import { calculateEMA } from './ema';

export const calculateMACD = (prices: number[]): { 
  macd: number[]; 
  signal: number[]; 
  histogram: number[]; 
} => {
  if (prices.length < 26) {
    return { macd: [0], signal: [0], histogram: [0] };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = ema12.map((value, index) => value - ema26[index]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return {
    macd: macdLine,
    signal: signalLine,
    histogram
  };
};