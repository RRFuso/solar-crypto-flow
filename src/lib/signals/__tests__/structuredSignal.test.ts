import { describe, it, expect } from 'vitest';
import { buildStructuredSignal, signalToOracleContext, MIN_CANDLES, type Candle } from '../structuredSignal';
import { BTC_4H_OHLC } from '../../technical/__tests__/fixtures';

const fromOHLC = (rows: [number, number, number][]): Candle[] =>
  rows.map(([h, l, c], i) => ({ openTime: Date.UTC(2026, 9, 10) + i * 4 * 3600e3, open: c, high: h, low: l, close: c, volume: 100 }));

const trend = (n: number, step: number): Candle[] =>
  Array.from({ length: n }, (_, i) => {
    const c = 100 + i * step + (i % 2 ? 0.3 : -0.3);
    return { openTime: i * 3600e3, open: c, high: c + 1, low: c - 1, close: c, volume: 100 };
  });

describe('buildStructuredSignal', () => {
  it('returns sem_dados when fewer than the minimum closed candles', () => {
    const s = buildStructuredSignal('BTC', '1h', trend(MIN_CANDLES - 1, 1));
    expect(s.status).toBe('sem_dados');
    expect(s.bias).toBe('neutro');
    expect(s.invalidation).toBeNull();
  });

  it('flags a steady uptrend as alta with invalidation at the recent low', () => {
    const c = trend(80, 1);
    const s = buildStructuredSignal('X', '1h', c);
    expect(s.bias).toBe('alta');
    expect(s.invalidation).toBe(Math.min(...c.slice(-20).map(x => x.low)));
  });

  it('flags a steady downtrend as baixa with invalidation at the recent high', () => {
    const c = trend(80, -1);
    const s = buildStructuredSignal('X', '1h', c);
    expect(s.bias).toBe('baixa');
    expect(s.invalidation).toBe(Math.max(...c.slice(-20).map(x => x.high)));
  });

  it('is deterministic on real BTC 4h candles and uses the last closed candle time', () => {
    const c = fromOHLC(BTC_4H_OHLC);
    const a = buildStructuredSignal('BTC', '4h', c);
    const b = buildStructuredSignal('BTC', '4h', c);
    expect(a).toEqual(b);
    expect(a.asOf).toBe(c[c.length - 1].openTime);
    expect(a.score).toBeGreaterThanOrEqual(-100);
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it('oracle context never contains buy/sell wording', () => {
    const txt = signalToOracleContext(buildStructuredSignal('X', '1h', trend(80, 1)));
    expect(txt).not.toMatch(/\b(compre|venda|buy|sell)\b/i);
  });
});
