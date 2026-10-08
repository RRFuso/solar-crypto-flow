/**
 * Avaliação mensurável de sinais (Fase 4).
 * Cada sinal tem horizonte fixo e é comparado a um baseline (ex.: BTC no mesmo período).
 * Só usa candles posteriores ao instante do sinal — nunca o candle em que foi emitido.
 */

export type SignalDirection = 'up' | 'down';

export interface EvalCandle {
  time: number; // ms, abertura do candle
  open: number;
  close: number;
}

export interface SignalRecord {
  emittedAt: number; // ms
  direction: SignalDirection;
  horizonBars: number;
}

export interface SignalOutcome {
  status: 'pending' | 'evaluated' | 'no_data';
  assetReturn: number | null;
  baselineReturn: number | null;
  excessReturn: number | null;
  hit: boolean | null;
}

function windowReturn(candles: EvalCandle[], emittedAt: number, horizon: number): number | null {
  const startIdx = candles.findIndex((c) => c.time > emittedAt); // primeiro candle após o sinal
  if (startIdx < 0) return null;
  const endIdx = startIdx + horizon - 1;
  if (endIdx >= candles.length) return NaN; // ainda pendente
  const entry = candles[startIdx].open;
  if (!(entry > 0)) return null;
  return (candles[endIdx].close - entry) / entry;
}

export function evaluateSignal(
  signal: SignalRecord,
  asset: EvalCandle[],
  baseline: EvalCandle[] | null,
): SignalOutcome {
  const a = windowReturn(asset, signal.emittedAt, signal.horizonBars);
  if (a === null) return { status: 'no_data', assetReturn: null, baselineReturn: null, excessReturn: null, hit: null };
  if (Number.isNaN(a)) return { status: 'pending', assetReturn: null, baselineReturn: null, excessReturn: null, hit: null };
  const b = baseline ? windowReturn(baseline, signal.emittedAt, signal.horizonBars) : 0;
  const base = b === null || Number.isNaN(b) ? null : b;
  const excess = base === null ? null : a - base;
  const ref = excess ?? a;
  const hit = signal.direction === 'up' ? ref > 0 : ref < 0;
  return { status: 'evaluated', assetReturn: a, baselineReturn: base, excessReturn: excess, hit };
}

export interface SignalStats {
  evaluated: number;
  pending: number;
  hitRate: number | null; // null quando amostra < minSample
  avgExcessReturn: number | null;
}

export function summarizeOutcomes(outcomes: SignalOutcome[], minSample = 20): SignalStats {
  const done = outcomes.filter((o) => o.status === 'evaluated');
  const pending = outcomes.filter((o) => o.status === 'pending').length;
  if (done.length < minSample) {
    return { evaluated: done.length, pending, hitRate: null, avgExcessReturn: null };
  }
  const hits = done.filter((o) => o.hit).length;
  const ex = done.map((o) => o.excessReturn).filter((x): x is number => x !== null);
  return {
    evaluated: done.length,
    pending,
    hitRate: hits / done.length,
    avgExcessReturn: ex.length ? ex.reduce((s, x) => s + x, 0) / ex.length : null,
  };
}
