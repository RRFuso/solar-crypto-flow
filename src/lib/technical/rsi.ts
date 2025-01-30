export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  if (prices.length < period + 1) {
    return [50];
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsiValues: number[] = [];

  for (let i = period; i <= prices.length; i++) {
    avgGain = ((avgGain * (period - 1)) + (gains[i - 1] || 0)) / period;
    avgLoss = ((avgLoss * (period - 1)) + (losses[i - 1] || 0)) / period;

    const rs = avgGain / (avgLoss || 1);
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }

  return rsiValues;
};