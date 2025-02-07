
export const calculateOBV = (prices: number[], volumes: number[]): number[] => {
  if (prices.length < 2 || volumes.length < 2) {
    return [0];
  }

  const obv: number[] = [0];
  
  for (let i = 1; i < prices.length; i++) {
    const currentOBV = obv[i - 1] + (
      prices[i] > prices[i - 1] ? volumes[i] :
      prices[i] < prices[i - 1] ? -volumes[i] : 0
    );
    obv.push(currentOBV);
  }

  return obv;
};
