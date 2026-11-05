/**
 * Structured, deterministic signal built only from closed candles.
 * The AI (Oracle) may only interpret this object — never compute or alter it.
 */
import { calculateRSI } from '../technical/rsi';
import { calculateMACD } from '../technical/macd';
import { calculateEMA } from '../technical/ema';
import { calculateADX } from '../technical/adx';

export interface Candle { openTime: number; open: number; high: number; low: number; close: number; volume: number; }

export type SignalBias = 'alta' | 'baixa' | 'neutro';
export type SignalStatus = 'ativo' | 'sem_dados';

export interface SignalFactor { name: string; value: number; contribution: number; note: string; }

export interface StructuredSignal {
  symbol: string;
  timeframe: string;
  asOf: number | null;          // openTime of last closed candle used
  status: SignalStatus;
  bias: SignalBias;
  score: number;                // -100..100, heuristic, unvalidated
  factors: SignalFactor[];
  invalidation: number | null;  // price level that invalidates the bias
  horizonBars: number;
  disclaimer: string;
}

export const MIN_CANDLES = 60;
const DISCLAIMER = 'Sinal de Tendência heurístico, não validado. Conteúdo educacional, não é recomendação.';

/** Parâmetros calibráveis das regras. DEFAULT_PARAMS = comportamento vigente. */
export interface SignalParams {
  rsiUp: number;        // RSI acima disso contribui positivo
  rsiDown: number;      // RSI abaixo disso contribui negativo
  wRsi: number;         // peso do RSI
  wMacd: number;        // peso do histograma MACD
  wEma: number;         // peso preço vs EMA50
  adxWeak: number;      // ADX abaixo disso atenua (×0.5)
  adxStrong: number;    // ADX acima disso reforça (×1.2)
  adxGate: number;      // só emite sinal se ADX >= adxGate (0 = desligado)
  scoreCut: number;     // |score| mínimo para viés direcional
}

export const DEFAULT_PARAMS: SignalParams = {
  rsiUp: 55, rsiDown: 45, wRsi: 20, wMacd: 25, wEma: 25,
  adxWeak: 20, adxStrong: 30, adxGate: 0, scoreCut: 30,
};

const last = (a: number[]) => a[a.length - 1];

export function buildStructuredSignal(symbol: string, timeframe: string, candles: Candle[], horizonBars = 6, params: SignalParams = DEFAULT_PARAMS): StructuredSignal {
  const base: StructuredSignal = {
    symbol, timeframe, asOf: candles.length ? last(candles.map(c => c.openTime)) : null,
    status: 'sem_dados', bias: 'neutro', score: 0, factors: [], invalidation: null, horizonBars, disclaimer: DISCLAIMER,
  };
  if (candles.length < MIN_CANDLES || candles.some(c => !Number.isFinite(c.close))) return base;

  const close = candles.map(c => c.close);
  const high = candles.map(c => c.high);
  const low = candles.map(c => c.low);
  const vol = candles.map(c => c.volume);

  const rsi = last(calculateRSI(close, 14));
  const macd = calculateMACD(close);
  const hist = last(macd.histogram);
  const ema50 = last(calculateEMA(close, 50));
  const adx = calculateADX(high, low, close, 14);
  const price = last(close);
  const avgVol = vol.slice(-21, -1).reduce((s, v) => s + v, 0) / 20;
  const relVol = avgVol > 0 ? last(vol) / avgVol : NaN;

  const factors: SignalFactor[] = [];
  const add = (name: string, value: number, contribution: number, note: string) => {
    if (Number.isFinite(value)) factors.push({ name, value, contribution, note });
  };

  add('RSI(14)', rsi, rsi > 55 ? 20 : rsi < 45 ? -20 : 0, rsi > 70 ? 'sobrecomprado' : rsi < 30 ? 'sobrevendido' : 'faixa média');
  // Deadband: histogram below 0.02% of price is treated as flat noise
  const macdEps = price * 0.0002;
  add('MACD hist', hist, hist > macdEps ? 25 : hist < -macdEps ? -25 : 0,
    hist > macdEps ? 'momento positivo' : hist < -macdEps ? 'momento negativo' : 'momento neutro');
  add('Preço vs EMA50', (price / ema50 - 1) * 100, price > ema50 ? 25 : -25, price > ema50 ? 'acima da média' : 'abaixo da média');

  let raw = factors.reduce((s, f) => s + f.contribution, 0);
  // ADX scales conviction: weak trend dampens the score
  if (Number.isFinite(adx)) {
    const k = adx < 20 ? 0.5 : adx > 30 ? 1.2 : 1;
    factors.push({ name: 'ADX(14)', value: adx, contribution: 0, note: adx < 20 ? 'tendência fraca (atenua)' : adx > 30 ? 'tendência forte (reforça)' : 'tendência moderada' });
    raw *= k;
  }
  if (Number.isFinite(relVol)) {
    factors.push({ name: 'Volume relativo', value: relVol, contribution: 0, note: relVol > 1.5 ? 'volume acima do normal' : 'volume normal' });
    if (relVol > 1.5) raw *= 1.1;
  }

  const score = Math.max(-100, Math.min(100, Math.round(raw)));
  const bias: SignalBias = score >= 30 ? 'alta' : score <= -30 ? 'baixa' : 'neutro';
  const recent = candles.slice(-20);
  const invalidation = bias === 'alta' ? Math.min(...recent.map(c => c.low))
    : bias === 'baixa' ? Math.max(...recent.map(c => c.high)) : null;

  return { ...base, status: 'ativo', bias, score, factors, invalidation };
}

/** Compact text for the Oracle: facts only, AI must interpret, not recompute. */
export function signalToOracleContext(s: StructuredSignal): string {
  if (s.status === 'sem_dados') return `[SINAL ${s.symbol} ${s.timeframe}] sem dados suficientes.`;
  const f = s.factors.map(x => `${x.name}=${x.value.toFixed(2)} (${x.note})`).join('; ');
  return `[SINAL ${s.symbol} ${s.timeframe} @${new Date(s.asOf!).toISOString()}] viés=${s.bias} score=${s.score} invalidação=${s.invalidation ?? '—'} horizonte=${s.horizonBars} candles. Fatores: ${f}. ${s.disclaimer}`;
}
