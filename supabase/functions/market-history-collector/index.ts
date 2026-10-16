// Collects REAL closed Binance candles (spot) + open interest/funding (futures)
// in one batched server run and upserts them. Free public endpoints only.
// Authorization: internal (service key / vault cron secret) or admin JWT.
import { corsHeaders } from '../_shared/cors.ts';
import { resolveCaller, isInternalOrAdmin, deny, serviceClient } from '../_shared/auth.ts';

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
  'TRX', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'INJ'];
const TIMEFRAMES = ['1h', '4h'];
const LIMIT = 200;
const RETENTION_DAYS = 60;

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

  const cutoff = new Date(now - RETENTION_DAYS * 86_400_000).toISOString();
  await db.from('market_candles').delete().lt('open_time', cutoff);
  await db.from('market_derivatives').delete().lt('ts', cutoff);

  return json({ success: true, candles, derivatives: derivs, missing });
});
