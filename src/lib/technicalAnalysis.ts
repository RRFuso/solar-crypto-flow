export const calculateRSI = (prices: number[]): number[] => {
  const rsiPeriod = 14;
  const rsiValues: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // Calculate initial averages
  let avgGain = gains.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
  let avgLoss = losses.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;

  // Calculate RSI values
  for (let i = rsiPeriod; i <= prices.length; i++) {
    avgGain = ((avgGain * (rsiPeriod - 1)) + (gains[i - 1] || 0)) / rsiPeriod;
    avgLoss = ((avgLoss * (rsiPeriod - 1)) + (losses[i - 1] || 0)) / rsiPeriod;

    const rs = avgGain / (avgLoss || 1); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }

  return rsiValues;
};

export const calculateEMA = (prices: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const emaValues: number[] = [];
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period - 1; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
    emaValues.push(ema);
  }

  return emaValues;
};