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

export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    middle: sma,
    upper: sma + (standardDeviation * stdDev),
    lower: sma - (standardDeviation * stdDev),
    width: (standardDeviation * 4) / sma // Normalized width
  };
};

export const calculateADX = (high: number[], low: number[], close: number[], period: number = 14): number => {
  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < high.length; i++) {
    // True Range
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));

    // Directional Movement
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  // Calculate ADX
  const smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b) / period;
  const smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b) / period;
  const smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b) / period;

  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
  return dx;
};

export const checkVolumeSpike = (volumes: number[]): boolean => {
  const avgVolume = volumes.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = volumes[volumes.length - 1];
  return currentVolume > avgVolume * 1.2 && currentVolume < avgVolume * 2;
};

export const checkGoldenCross = (prices: number[], shortPeriod: number = 9, longPeriod: number = 21): boolean => {
  const shortEMA = calculateEMA(prices, shortPeriod);
  const longEMA = calculateEMA(prices, longPeriod);
  return shortEMA[shortEMA.length - 1] > longEMA[longEMA.length - 1];
};