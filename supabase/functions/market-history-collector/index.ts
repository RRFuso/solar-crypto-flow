// Collects REAL closed Binance candles (spot) + open interest/funding (futures)
// in one batched server run and upserts them. Free public endpoints only.
// Authorization: internal (service key / vault cron secret) or admin JWT.
import { corsHeaders } from '../_shared/cors.ts';
import { resolveCaller, isInternalOrAdmin, deny, serviceClient } from '../_shared/auth.ts';

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
  'TRX', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'INJ'];
const TIMEFRAMES = ['1h', '4h'];
const LIMIT = 200;
const CANDLE_RETENTION_DAYS = 400; // long history for signal backtests
const DERIV_RETENTION_DAYS = 60;   // Binance only serves ~30d of OI history anyway
const MAX_BACKFILL_DAYS = 365;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function getJson(url: string): Promise<any | null> {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const caller = await resolveCaller(req);
  if (!isInternalOrAdmin(caller)) return deny(caller, corsHeaders);

  const db = serviceClient();
  const now = Date.now();

  // Backfill mode: page older closed spot candles (1000/request) for a few symbols per call.
  let body: any = {};
  try { body = await req.json(); } catch { /* cron sends no body */ }
  if (body?.backfill === true) {
    const days = Math.min(Math.max(Number(body.days) || 365, 1), MAX_BACKFILL_DAYS);
    const req_syms: string[] = Array.isArray(body.symbols) ? body.symbols.filter((x: unknown) => typeof x === 'string' && SYMBOLS.includes(x as string)).slice(0, 5) : [];
    if (!req_syms.length) return json({ error: 'symbols required (max 5, from tracked list)' }, 400);
    const start = now - days * 86_400_000;
    let total = 0; const miss: string[] = [];
    for (const base of req_syms) {
      for (const tf of TIMEFRAMES) {
        let from = start;
        while (from < now) {
          const kl = await getJson(`https://api.binance.com/api/v3/klines?symbol=${base}USDT&interval=${tf}&startTime=${from}&limit=1000`);
          if (!Array.isArray(kl) || !kl.length) { if (!Array.isArray(kl)) miss.push(`${base}:${tf}`); break; }
          const rows = kl.filter((k: any[]) => Number(k[6]) < now).map((k: any[]) => ({
            symbol: base, timeframe: tf, open_time: new Date(Number(k[0])).toISOString(),
            open: +k[1], high: +k[2], low: +k[3], close: +k[4], quote_volume: +k[7],
            source: 'binance_spot', fetched_at: new Date(now).toISOString(),
          }));
          if (rows.length) {
            const { error } = await db.from('market_candles').upsert(rows, { onConflict: 'symbol,timeframe,open_time' });
            if (!error) total += rows.length; else console.error(base, tf, error.message);
          }
          from = Number(kl[kl.length - 1][0]) + 1;
          if (kl.length < 1000) break;
        }
      }
    }
    return json({ success: true, backfill: true, days, symbols: req_syms, candles: total, missing: miss });
  }

  let candles = 0, derivs = 0;
  const missing: string[] = [];

  for (const base of SYMBOLS) {
    const pair = `${base}USDT`;
    for (const tf of TIMEFRAMES) {
      const kl = await getJson(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${tf}&limit=${LIMIT}`);
      if (Array.isArray(kl)) {
        const rows = kl.filter((k: any[]) => Number(k[6]) < now).map((k: any[]) => ({
          symbol: base, timeframe: tf, open_time: new Date(Number(k[0])).toISOString(),
          open: +k[1], high: +k[2], low: +k[3], close: +k[4], quote_volume: +k[7],
          source: 'binance_spot', fetched_at: new Date(now).toISOString(),
        }));
        const { error } = await db.from('market_candles').upsert(rows, { onConflict: 'symbol,timeframe,open_time' });
        if (!error) candles += rows.length; else console.error(pair, tf, error.message);
      } else missing.push(`${pair}:${tf}:spot`);

      const oi = await getJson(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${pair}&period=${tf}&limit=${LIMIT}`);
      if (Array.isArray(oi) && oi.length) {
        const rows = oi.map((p: any) => ({
          symbol: base, timeframe: tf, ts: new Date(Number(p.timestamp)).toISOString(),
          open_interest: parseFloat(p.sumOpenInterest), open_interest_usd: parseFloat(p.sumOpenInterestValue),
          funding_rate: null, source: 'binance_futures', fetched_at: new Date(now).toISOString(),
        }));
        const { error } = await db.from('market_derivatives').upsert(rows, { onConflict: 'symbol,timeframe,ts' });
        if (!error) derivs += rows.length;
      } else missing.push(`${pair}:${tf}:oi`);
    }

    // Funding history (8h settlements) stored with timeframe '8h'.
    const fr = await getJson(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${pair}&limit=100`);
    if (Array.isArray(fr) && fr.length) {
      const rows = fr.map((f: any) => ({
        symbol: base, timeframe: '8h', ts: new Date(Number(f.fundingTime)).toISOString(),
        open_interest: null, open_interest_usd: null, funding_rate: parseFloat(f.fundingRate),
        source: 'binance_futures', fetched_at: new Date(now).toISOString(),
      }));
      const { error } = await db.from('market_derivatives').upsert(rows, { onConflict: 'symbol,timeframe,ts' });
      if (!error) derivs += rows.length;
    }
  }

  await db.from('market_candles').delete().lt('open_time', new Date(now - CANDLE_RETENTION_DAYS * 86_400_000).toISOString());
  await db.from('market_derivatives').delete().lt('ts', new Date(now - DERIV_RETENTION_DAYS * 86_400_000).toISOString());

  return json({ success: true, candles, derivatives: derivs, missing });
});
