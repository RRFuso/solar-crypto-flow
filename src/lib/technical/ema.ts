export const calculateEMA = (prices: number[], period: number): number[] => {
  if (prices.length < period) {
    return [prices[prices.length - 1] || 0];
  }

  const emaValues: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let prevEMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaValues.push(prevEMA);

  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - prevEMA) * multiplier + prevEMA;
    emaValues.push(currentEMA);
    prevEMA = currentEMA;
  }

  return emaValues;
};