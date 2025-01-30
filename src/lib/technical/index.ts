export * from './rsi';
export * from './ema';
export * from './macd';
export * from './bollinger';

// Scoring criteria for explosive detection
export const EXPLOSIVE_CRITERIA = {
  volumeExplosive: 3,
  macdCrossoverHigh: 2,
  rsiBuyZone: 2,
  adxStrength: 1,
  emaCrossover: 3,
  bollingerBreakout: 1,
  fibonacciSupport: 2
} as const;

export type ExplosiveCriteria = keyof typeof EXPLOSIVE_CRITERIA;