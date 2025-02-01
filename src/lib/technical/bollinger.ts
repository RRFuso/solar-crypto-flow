export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1] || 0;
    return {
      middle: lastPrice,
      upper: lastPrice,
      lower: lastPrice,
      width: 0
    };
  }

  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    middle: sma,
    upper: sma + (standardDeviation * stdDev),
    lower: sma - (standardDeviation * stdDev),
    width: (standardDeviation * 4) / sma
  };
};