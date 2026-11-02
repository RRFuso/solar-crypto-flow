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

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Wilder smoothing (sums; the period factor cancels in the ratios)
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];
  for (let i = period; i < trueRanges.length; i++) {
    atr = atr - atr / period + trueRanges[i];
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];

    if (atr === 0) continue;
    const plusDI = 100 * (smoothedPlusDM / atr);
    const minusDI = 100 * (smoothedMinusDM / atr);
    if (plusDI + minusDI === 0) continue;
    dxValues.push(100 * Math.abs(plusDI - minusDI) / (plusDI + minusDI));
  }

  if (dxValues.length === 0) return 0;
  // Not enough DX values for a full ADX: fall back to the latest DX
  if (dxValues.length < period) return dxValues[dxValues.length - 1];

  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
  }
  return adx;
};
