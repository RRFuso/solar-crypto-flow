/**
 * Binance USDⓈ-M Futures public data (no key, CORS enabled).
 * - Klines:            /fapi/v1/klines
 * - OI history:        /futures/data/openInterestHist  (max 500 pts, last 30 days)
 * - Funding (current): /fapi/v1/premiumIndex
 * Liquidation history is NOT available via public REST, so it's reported as unavailable.
 */

export type OITimeframe = '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export const OI_TIMEFRAMES: { value: OITimeframe; label: string; tv: string; ms: number }[] = [
  { value: '5m', label: '5m', tv: '5', ms: 5 * 60_000 },
  { value: '15m', label: '15m', tv: '15', ms: 15 * 60_000 },
  { value: '30m', label: '30m', tv: '30', ms: 30 * 60_000 },
  { value: '1h', label: '1h', tv: '60', ms: 60 * 60_000 },
  { value: '4h', label: '4h', tv: '240', ms: 4 * 60 * 60_000 },
  { value: '1d', label: '1D', tv: 'D', ms: 24 * 60 * 60_000 },
];

export const tfMs = (tf: OITimeframe) => OI_TIMEFRAMES.find(t => t.value === tf)!.ms;

export interface AlignedCandle {
  /** Candle close boundary (ms) — OI snapshot is taken at this instant */
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  quoteVolume: number;
  oi: number;        // contracts (base asset)
  oiValue: number;   // USD notional
}

export interface OIRawData {
  symbol: string;
  timeframe: OITimeframe;
  candles: AlignedCandle[];
  fundingRate: number | null;
  fetchedAt: number;
}

const FAPI = 'https://fapi.binance.com';

export class OIUnavailableError extends Error {}

export async function fetchOpenInterestData(baseSymbol: string, timeframe: OITimeframe): Promise<OIRawData> {
  const symbol = `${baseSymbol.toUpperCase().replace(/USDT$/, '')}USDT`;
  const limit = timeframe === '1d' ? 30 : 500; // OI history is limited to 30 days

  const [oiRes, klRes, fundRes] = await Promise.all([
    fetch(`${FAPI}/futures/data/openInterestHist?symbol=${symbol}&period=${timeframe}&limit=${limit}`),
    fetch(`${FAPI}/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit + 1}`),
    fetch(`${FAPI}/fapi/v1/premiumIndex?symbol=${symbol}`).catch(() => null),
  ]);

  if (!oiRes.ok || !klRes.ok) {
    throw new OIUnavailableError(`${symbol} não possui contrato perpétuo na Binance Futures`);
  }

  const oiJson: Array<{ sumOpenInterest: string; sumOpenInterestValue: string; timestamp: number }> = await oiRes.json();
  const klJson: any[][] = await klRes.json();
  if (!Array.isArray(oiJson) || oiJson.length === 0) throw new OIUnavailableError(`Sem histórico de OI para ${symbol}`);

  const oiByTime = new Map<number, { oi: number; oiValue: number }>();
  for (const p of oiJson) {
    oiByTime.set(Number(p.timestamp), { oi: parseFloat(p.sumOpenInterest), oiValue: parseFloat(p.sumOpenInterestValue) });
  }

  // Align: OI snapshot at T corresponds to the candle whose close boundary (closeTime + 1) === T.
  const now = Date.now();
  const candles: AlignedCandle[] = [];
  for (const k of klJson) {
    const closeBoundary = Number(k[6]) + 1;
    if (closeBoundary > now) continue; // skip open (unfinished) candle
    const oi = oiByTime.get(closeBoundary);
    if (!oi) continue; // no silent fill — drop unmatched candles
    candles.push({
      time: closeBoundary,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      quoteVolume: parseFloat(k[7]),
      oi: oi.oi,
      oiValue: oi.oiValue,
    });
  }

  let fundingRate: number | null = null;
  if (fundRes && fundRes.ok) {
    const f = await fundRes.json();
    const r = parseFloat(f?.lastFundingRate);
    fundingRate = Number.isFinite(r) ? r : null;
  }

  return { symbol, timeframe, candles, fundingRate, fetchedAt: now };
}
