export const calculateRSI = (prices: number[], period: number = 14): number[] => {
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
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate RSI values
  for (let i = period; i <= prices.length; i++) {
    avgGain = ((avgGain * (period - 1)) + (gains[i - 1] || 0)) / period;
    avgLoss = ((avgLoss * (period - 1)) + (losses[i - 1] || 0)) / period;

    const rs = avgGain / (avgLoss || 1); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }

  return rsiValues;
};

export const calculateEMA = (prices: number[], period: number): number[] => {
  const emaValues: number[] = [];
  const multiplier = 2 / (period + 1);
  let prevEMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] - prevEMA) * multiplier + prevEMA;
    emaValues.push(currentEMA);
    prevEMA = currentEMA;
  }

  return emaValues;
};

export const checkGoldenCross = (prices: number[], shortPeriod: number = 9, longPeriod: number = 21): boolean => {
  const shortEMA = calculateEMA(prices, shortPeriod);
  const longEMA = calculateEMA(prices, longPeriod);
  return shortEMA[shortEMA.length - 1] > longEMA[longEMA.length - 1];
};

export const checkVolumeSpike = (volumes: number[]): boolean => {
  const avgVolume = volumes.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  return volumes[volumes.length - 1] > avgVolume * 2;
};