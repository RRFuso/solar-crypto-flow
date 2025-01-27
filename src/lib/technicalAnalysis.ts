export const calculateRSI = (prices: number[]): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];
  const period = 14;
  const rsiValues: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate RSI values
  for (let i = period; i < prices.length; i++) {
    avgGain = (avgGain * (period - 1) + (gains[i - 1] || 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (losses[i - 1] || 0)) / period;
    
    const rs = avgGain / (avgLoss || 1); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }

  return rsiValues;
};

export const calculateEMA = (prices: number[], period: number): number[] => {
  const emaValues: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaValues.push(ema);

  // Calculate EMA values
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
    emaValues.push(ema);
  }

  return emaValues;
};