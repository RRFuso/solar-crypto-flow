export const calculateADX = (high: number[], low: number[], close: number[], period: number = 14): number => {
  if (high.length < period + 1 || low.length < period + 1 || close.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < high.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));

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

  const smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (smoothedTR === 0) return 0;

  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  if (plusDI + minusDI === 0) return 0;

  const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
  return dx;
};