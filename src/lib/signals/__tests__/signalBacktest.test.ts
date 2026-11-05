import { describe, it, expect } from 'vitest';
import { backtestStructuredSignal } from '../signalBacktest';
import type { Candle } from '../structuredSignal';

function mkCandles(closes: number[], start = 1_700_000_000_000, stepMs = 3_600_000): Candle[] {
  return closes.map((close, i) => ({
    openTime: start + i * stepMs,
    open: i === 0 ? close : closes[i - 1],
    high: Math.max(close, i === 0 ? close : closes[i - 1]) * 1.001,
    low: Math.min(close, i === 0 ? close : closes[i - 1]) * 0.999,
    close,
    volume: 1000,
  }));
}

describe('backtestStructuredSignal', () => {
  it('não emite sinais com menos de MIN_CANDLES candles', () => {
    const rows = backtestStructuredSignal('BTC', '1h', mkCandles(Array(50).fill(100)), null);
    expect(rows.rows).toHaveLength(0);
    expect(rows.total.evaluated).toBe(0);
  });

  it('numa subida forte e contínua, sinais de alta avaliados devem acertar', () => {
    // 130 candles subindo ~0.8% cada: tendência clara, RSI/MACD/EMA alinhados
    const closes = Array.from({ length: 130 }, (_, i) => 100 * Math.pow(1.008, i));
    const res = backtestStructuredSignal('BTC', '1h', mkCandles(closes), null, { horizonBars: 6, step: 1, minSample: 1 });
    expect(res.rows.length).toBeGreaterThan(20);
    expect(res.rows.every((r) => r.bias === 'alta')).toBe(true);
    expect(res.total.hitRate).not.toBeNull();
    expect(res.total.hitRate!).toBeGreaterThan(0.9);
  });

  it('numa queda forte e contínua, sinais de baixa avaliados devem acertar', () => {
    const closes = Array.from({ length: 130 }, (_, i) => 100 * Math.pow(0.992, i));
    const res = backtestStructuredSignal('BTC', '1h', mkCandles(closes), null, { horizonBars: 6, step: 1, minSample: 1 });
    expect(res.rows.length).toBeGreaterThan(20);
    expect(res.rows.every((r) => r.bias === 'baixa')).toBe(true);
    expect(res.total.hitRate!).toBeGreaterThan(0.9);
  });

  it('nunca usa candles futuros: o resultado não muda se o futuro for alterado', () => {
    const base = Array.from({ length: 130 }, (_, i) => 100 * Math.pow(1.005, i));
    const altered = [...base];
    // muda drasticamente os últimos 10 candles (futuro em relação aos primeiros sinais)
    for (let i = 120; i < 130; i++) altered[i] = base[i] * 0.5;
    const a = backtestStructuredSignal('BTC', '1h', mkCandles(base), null, { horizonBars: 6, step: 1, minSample: 1 });
    const b = backtestStructuredSignal('BTC', '1h', mkCandles(altered), null, { horizonBars: 6, step: 1, minSample: 1 });
    // sinais emitidos antes do índice 120 devem ter score/idênticos nos dois cenários
    const earlyA = a.rows.filter((r) => r.emittedAt < 1_700_000_000_000 + 120 * 3_600_000);
    const earlyB = b.rows.filter((r) => r.emittedAt < 1_700_000_000_000 + 120 * 3_600_000);
    expect(earlyA.map((r) => r.score)).toEqual(earlyB.map((r) => r.score));
  });

  it('respeita minSample: amostra pequena não reporta taxa de acerto', () => {
    const closes = Array.from({ length: 75 }, (_, i) => 100 * Math.pow(1.008, i));
    const res = backtestStructuredSignal('BTC', '1h', mkCandles(closes), null, { horizonBars: 6, step: 5 });
    expect(res.total.evaluated).toBeLessThan(20);
    expect(res.total.hitRate).toBeNull();
  });
});
