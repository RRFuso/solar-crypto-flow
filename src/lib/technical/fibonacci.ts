export const calculateFibonacciLevels = (high: number, low: number): { level: number, price: number }[] => {
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const range = high - low;
  
  return levels.map(level => ({
    level,
    price: high - (range * level)
  }));
};