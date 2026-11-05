/**
 * Calibra os parâmetros do sinal estruturado contra o histórico real.
 * Divide o histórico em TREINO (1ª metade) e VALIDAÇÃO (2ª metade):
 * a configuração é escolhida no treino e só confirmada na validação,
 * para não reportar um acerto que só existiu no passado usado na escolha.
 * Uso: bun scripts/calibrate-signals.ts
 */
import { readFileSync } from 'fs';
import { backtestStructuredSignal } from '../src/lib/signals/signalBacktest';
import { DEFAULT_PARAMS, type Candle, type SignalParams } from '../src/lib/signals/structuredSignal';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT'];

// Grade pequena e deliberada: poucos graus de liberdade para não sobreajustar
const GRID: SignalParams[] = [];
for (const scoreCut of [30, 45, 60]) {
  for (const adxGate of [0, 20, 25]) {
    for (const wRsi of [20, 0]) {
      GRID.push({ ...DEFAULT_PARAMS, scoreCut, adxGate, wRsi });
    }
  }
}

interface ConfigResult { params: SignalParams; trainHit: number | null; trainN: number; valHit: number | null; valN: number; }

function runSet(params: SignalParams, data: Map<string, Candle[]>, btc: Candle[], tf: string, horizon: number, minSample: number) {
  let hit = 0, n = 0;
  for (const sym of SYMBOLS) {
    const candles = data.get(`${sym}:${tf}`);
    if (!candles || candles.length < 90) continue;
    const res = backtestStructuredSignal(sym, tf, candles, sym === 'BTC' ? null : btc, { horizonBars: horizon, step: tf === '1h' ? 2 : 1, params, minSample: 1 });
    for (const row of res.rows) {
      if (row.outcome.status !== 'evaluated') continue;
      n++; if (row.outcome.hit) hit++;
    }
  }
  return { hitRate: n >= minSample ? hit / n : null, n };
}

async function main() {
  // Baixa tudo uma vez
  const data = new Map<string, Candle[]>();
  for (const tf of ['1h', '4h']) for (const sym of SYMBOLS) data.set(`${sym}:${tf}`, await fetchCandles(sym, tf));

  const results: ConfigResult[] = [];
  for (const params of GRID) {
    let trainHit = 0, trainN = 0, valHit = 0, valN = 0;
    for (const tf of ['1h', '4h']) {
      const horizon = tf === '1h' ? 6 : 3;
      const btcFull = data.get(`BTC:${tf}`)!;
      const cut = Math.floor(btcFull.length / 2);
      const slices = new Map<string, { train: Candle[]; val: Candle[] }>();
      for (const sym of SYMBOLS) {
        const c = data.get(`${sym}:${tf}`)!;
        slices.set(sym, { train: c.slice(0, cut), val: c.slice(Math.max(0, cut - 70)) }); // val inclui 70 candles de aquecimento
      }
      const evalSlice = (which: 'train' | 'val') => {
        let h = 0, n = 0;
        for (const sym of SYMBOLS) {
          const s = slices.get(sym)!;
          const candles = which === 'train' ? s.train : s.val;
          if (candles.length < 90) continue;
          const btc = which === 'train' ? btcFull.slice(0, cut) : btcFull.slice(Math.max(0, cut - 70));
          const res = backtestStructuredSignal(sym, tf, candles, sym === 'BTC' ? null : btc, { horizonBars: horizon, step: tf === '1h' ? 2 : 1, params, minSample: 1 });
          for (const row of res.rows) {
            if (row.outcome.status !== 'evaluated') continue;
            n++; if (row.outcome.hit) h++;
          }
        }
        return { h, n };
      };
      const tr = evalSlice('train'); trainHit += tr.h; trainN += tr.n;
      const va = evalSlice('val'); valHit += va.h; valN += va.n;
    }
    results.push({
      params,
      trainHit: trainN >= 100 ? trainHit / trainN : null, trainN,
      valHit: valN >= 100 ? valHit / valN : null, valN,
    });
  }

  results.sort((a, b) => (b.trainHit ?? 0) - (a.trainHit ?? 0));
  const pct = (x: number | null) => (x === null ? '  —  ' : `${(x * 100).toFixed(1)}%`);
  console.log('scoreCut adxGate wRsi | TREINO (n, acerto) | VALIDAÇÃO (n, acerto)');
  for (const r of results) {
    console.log(
      `${String(r.params.scoreCut).padStart(5)} ${String(r.params.adxGate).padStart(7)} ${String(r.params.wRsi).padStart(5)} | ` +
      `${String(r.trainN).padStart(4)} ${pct(r.trainHit)} | ${String(r.valN).padStart(4)} ${pct(r.valHit)}`,
    );
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
