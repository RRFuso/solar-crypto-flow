import { describe, it, expect } from 'vitest';
import { calculateRSI } from '../rsi';
import { calculateEMA } from '../ema';
import { calculateMACD } from '../macd';
import { calculateBollingerBands } from '../bollinger';
import { calculateADX } from '../adx';
import { BTC_1H_CLOSES, BTC_4H_OHLC, EXPECTED } from './fixtures';

const BTC_4H_CLOSES = BTC_4H_OHLC.map(([, , c]) => c);
const BTC_4H_HIGHS = BTC_4H_OHLC.map(([h]) => h);
const BTC_4H_LOWS = BTC_4H_OHLC.map(([, l]) => l);

const closeTo = (expected: number, precision = 6) =>
  expect.closeTo(expected, precision);

describe('indicators on real BTC candles (1h)', () => {
  it('RSI(14) matches the Wilder reference value and length', () => {
    const rsi = calculateRSI(BTC_1H_CLOSES, 14);
    expect(rsi).toHaveLength(EXPECTED.rsi14_1h.length);
    closeTo(EXPECTED.rsi14_1h.last)(rsi[rsi.length - 1]);
    expect(rsi.every(v => v >= 0 && v <= 100)).toBe(true);
  });

  it('EMA(9) and EMA(21) match reference values', () => {
    const ema9 = calculateEMA(BTC_1H_CLOSES, 9);
    const ema21 = calculateEMA(BTC_1H_CLOSES, 21);
    closeTo(EXPECTED.ema9_1h)(ema9[ema9.length - 1]);
    closeTo(EXPECTED.ema21_1h)(ema21[ema21.length - 1]);
  });

  it('MACD line, signal and histogram are aligned by price index', () => {
    const { macd, signal, histogram } = calculateMACD(BTC_1H_CLOSES);
    closeTo(EXPECTED.macd_1h.macd)(macd[macd.length - 1]);
    closeTo(EXPECTED.macd_1h.signal)(signal[signal.length - 1]);
    closeTo(EXPECTED.macd_1h.histogram)(histogram[histogram.length - 1]);
    // Alignment invariant: histogram must equal macd - signal at the same point
    closeTo(macd[macd.length - 1] - signal[signal.length - 1])(histogram[histogram.length - 1]);
  });

  it('Bollinger Bands (20, 2) match reference values', () => {
    const bb = calculateBollingerBands(BTC_1H_CLOSES);
    closeTo(EXPECTED.bollinger_1h.middle)(bb.middle);
    closeTo(EXPECTED.bollinger_1h.upper)(bb.upper);
    closeTo(EXPECTED.bollinger_1h.lower)(bb.lower);
  });
});

describe('indicators on real BTC candles (4h)', () => {
  it('RSI(14) matches the Wilder reference value', () => {
    const rsi = calculateRSI(BTC_4H_CLOSES, 14);
    expect(rsi).toHaveLength(EXPECTED.rsi14_4h.length);
    closeTo(EXPECTED.rsi14_4h.last)(rsi[rsi.length - 1]);
  });

  it('EMA(9) matches the reference value', () => {
    const ema9 = calculateEMA(BTC_4H_CLOSES, 9);
    closeTo(EXPECTED.ema9_4h)(ema9[ema9.length - 1]);
  });

  it('MACD line, signal and histogram are aligned by price index', () => {
    const { macd, signal, histogram } = calculateMACD(BTC_4H_CLOSES);
    closeTo(EXPECTED.macd_4h.macd)(macd[macd.length - 1]);
    closeTo(EXPECTED.macd_4h.signal)(signal[signal.length - 1]);
    closeTo(EXPECTED.macd_4h.histogram)(histogram[histogram.length - 1]);
    closeTo(macd[macd.length - 1] - signal[signal.length - 1])(histogram[histogram.length - 1]);
  });

  it('Bollinger Bands (20, 2) match reference values', () => {
    const bb = calculateBollingerBands(BTC_4H_CLOSES);
    closeTo(EXPECTED.bollinger_4h.middle)(bb.middle);
    closeTo(EXPECTED.bollinger_4h.upper)(bb.upper);
    closeTo(EXPECTED.bollinger_4h.lower)(bb.lower);
  });

  it("ADX(14) matches the Wilder reference value and uses recent data", () => {
    const adx = calculateADX(BTC_4H_HIGHS, BTC_4H_LOWS, BTC_4H_CLOSES, 14);
    closeTo(EXPECTED.adx14_4h)(adx);
    expect(adx).toBeGreaterThanOrEqual(0);
    expect(adx).toBeLessThanOrEqual(100);
  });
});

describe('edge cases', () => {
  it('RSI returns the neutral fallback with insufficient data', () => {
    expect(calculateRSI([1, 2, 3], 14)).toEqual([50]);
  });

  it('MACD returns zero placeholders with insufficient data', () => {
    expect(calculateMACD([1, 2, 3])).toEqual({ macd: [0], signal: [0], histogram: [0] });
  });

  it('ADX returns 0 with insufficient data', () => {
    expect(calculateADX([1, 2], [1, 2], [1, 2])).toBe(0);
  });

  it('no indicator produces NaN on flat prices', () => {
    const flat = Array(60).fill(100);
    expect(calculateRSI(flat).every(v => !Number.isNaN(v))).toBe(true);
    const { macd, signal, histogram } = calculateMACD(flat);
    expect([...macd, ...signal, ...histogram].every(v => !Number.isNaN(v))).toBe(true);
    expect(Number.isNaN(calculateADX(flat, flat, flat))).toBe(false);
  });
});
