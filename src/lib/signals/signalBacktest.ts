/**
 * Backtest walk-forward do sinal estruturado sobre candles históricos.
 * Em cada passo, o sinal usa APENAS candles até aquele instante (sem look-ahead)
 * e é avaliado com horizonte fixo contra um baseline opcional (ex.: BTC).
 */
import { buildStructuredSignal, MIN_CANDLES, type Candle, type SignalBias } from './structuredSignal';
import { evaluateSignal, summarizeOutcomes, type EvalCandle, type SignalOutcome, type SignalStats } from './signalEvaluation';

export interface BacktestRow {
  symbol: string;
  timeframe: string;
  bias: SignalBias;
  emittedAt: number;
  score: number;
  outcome: SignalOutcome;
}

export interface BacktestSummary {
  total: SignalStats;
  byBias: Record<'alta' | 'baixa', SignalStats>;
  rows: BacktestRow[];
}

const toEval = (c: Candle[]): EvalCandle[] => c.map((x) => ({ time: x.openTime, open: x.open, close: x.close }));

/**
 * Percorre o histórico emitindo um sinal a cada `step` candles.
 * Sinais 'neutro' não são emitidos (não há direção a medir).
 */
export function backtestStructuredSignal(
  symbol: string,
  timeframe: string,
  candles: Candle[],
  baseline: Candle[] | null,
  opts: { horizonBars?: number; step?: number; minSample?: number } = {},
): BacktestSummary {
  const horizon = opts.horizonBars ?? 6;
  const step = Math.max(1, opts.step ?? 1);
  const assetEval = toEval(candles);
  const baseEval = baseline ? toEval(baseline) : null;
  const rows: BacktestRow[] = [];

  // Último índice em que ainda há `horizon` candles futuros para avaliar
  const lastEmittable = candles.length - 1 - horizon;
  for (let i = MIN_CANDLES; i <= lastEmittable; i += step) {
    const window = candles.slice(0, i + 1);
    const signal = buildStructuredSignal(symbol, timeframe, window, horizon);
    if (signal.status !== 'ativo' || signal.bias === 'neutro' || signal.asOf === null) continue;
    const outcome = evaluateSignal(
      { emittedAt: signal.asOf, direction: signal.bias === 'alta' ? 'up' : 'down', horizonBars: horizon },
      assetEval,
      baseEval,
    );
    rows.push({ symbol, timeframe, bias: signal.bias, emittedAt: signal.asOf, score: signal.score, outcome });
  }

  const minSample = opts.minSample ?? 20;
  return {
    total: summarizeOutcomes(rows.map((r) => r.outcome), minSample),
    byBias: {
      alta: summarizeOutcomes(rows.filter((r) => r.bias === 'alta').map((r) => r.outcome), minSample),
      baixa: summarizeOutcomes(rows.filter((r) => r.bias === 'baixa').map((r) => r.outcome), minSample),
    },
    rows,
  };
}
