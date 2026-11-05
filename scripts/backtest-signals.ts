/**
 * Roda o backtest do sinal estruturado contra os candles reais em market_candles.
 * Uso: bun scripts/backtest-signals.ts
 * Lê VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY do .env (chave anon, leitura pública).
 */
import { readFileSync } from 'fs';
import { backtestStructuredSignal } from '../src/lib/signals/signalBacktest';
import type { Candle } from '../src/lib/signals/structuredSignal';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!URL || !KEY) { console.error('Faltam VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY no .env'); process.exit(1); }

async function fetchCandles(symbol: string, timeframe: string): Promise<Candle[]> {
  const p = new URLSearchParams({
    select: 'open_time,open,high,low,close,quote_volume',
    symbol: `eq.${symbol}`, timeframe: `eq.${timeframe}`,
    order: 'open_time.asc', limit: '1000',
  });
  const r = await fetch(`${URL}/rest/v1/market_candles?${p}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`${symbol} ${timeframe}: HTTP ${r.status}`);
  const rows = (await r.json()) as { open_time: string; open: number; high: number; low: number; close: number; quote_volume: number }[];
  return rows.map((x) => ({ openTime: new Date(x.open_time).getTime(), open: +x.open, high: +x.high, low: +x.low, close: +x.close, volume: +x.quote_volume }));
}

const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);

async function main() {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT'];
  const timeframes = ['1h', '4h'] as const;
  for (const tf of timeframes) {
    const horizon = tf === '1h' ? 6 : 3; // ~6h e ~12h à frente
    const btc = await fetchCandles('BTC', tf);
    console.log(`\n=== ${tf} | horizonte ${horizon} candles | baseline BTC ===`);
    console.log('symbol      n   hitRate  avgExcess   alta(n/hit)      baixa(n/hit)');
    for (const sym of symbols) {
      const candles = await fetchCandles(sym, tf);
      if (candles.length < 80) { console.log(`${sym.padEnd(11)} dados insuficientes (${candles.length})`); continue; }
      const res = backtestStructuredSignal(sym, tf, candles, sym === 'BTC' ? null : btc, { horizonBars: horizon, step: tf === '1h' ? 2 : 1 });
      const t = res.total;
      console.log(
        `${sym.padEnd(11)} ${String(t.evaluated).padEnd(4)}${pct(t.hitRate).padStart(7)}  ${pct(t.avgExcessReturn).padStart(9)}   ` +
        `${String(res.byBias.alta.evaluated).padStart(3)}/${pct(res.byBias.alta.hitRate).padStart(6)}     ${String(res.byBias.baixa.evaluated).padStart(3)}/${pct(res.byBias.baixa.hitRate).padStart(6)}`,
      );
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
