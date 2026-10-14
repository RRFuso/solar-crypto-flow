
import { fetchKlines } from '@/lib/binance';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { calculateRSI, calculateEMA, calculateMACD, calculateBollingerBands, calculateADX } from '@/lib/technicalAnalysis';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const INTERVAL_MS: Record<string, number> = {
  '15m': 15 * 60_000, '30m': 30 * 60_000, '1h': HOUR_MS, '2h': 2 * HOUR_MS,
  '4h': 4 * HOUR_MS, '6h': 6 * HOUR_MS, '12h': 12 * HOUR_MS, '1d': DAY_MS,
};
/** Candles needed before the first point so EMA50/MACD/BB are warmed up. */
const WARMUP_BARS = 60;
const HISTORY_BARS = 100;
const STABLES = new Set(['USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'BUSD', 'USDE']);
const last = (a: number[]) => a[a.length - 1];

export interface MarketDataPoint {
  symbol: string;
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
  // Technical indicators
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema9: number;
  ema21: number;
  ema50: number;
  bollingerBands: { upper: number; middle: number; lower: number; width: number };
  adx: number;
  // Price action features
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volatility24h: number;
  // Volume features
  volumeChange24h: number;
  volumeEMA: number;
  volumeSpike: boolean;
}

export interface OnChainMetrics {
  symbol: string;
  timestamp: number;
  activeAddresses: number;
  transactionVolume: number;
  networkGrowth: number;
  concentrationByLargeHolders: number;
  exchangeInflowOutflowRatio: number;
  averageCoinAge: number;
}

export interface SocialMetrics {
  symbol: string;
  timestamp: number;
  googleTrendsScore: number;
  twitterMentions: number;
  redditMentions: number;
  sentimentScore: number; // -1 to 1
  influencerScore: number;
  fearGreedIndex: number;
}

export class DataAggregator {
  private marketDataCache: Map<string, MarketDataPoint[]> = new Map();
  private onChainCache: Map<string, OnChainMetrics[]> = new Map();
  private socialCache: Map<string, SocialMetrics[]> = new Map();

  /**
   * Builds a market history per symbol from REAL closed Binance spot candles
   * (`<SYMBOL>USDT`). Indicators are computed only from candles known at each
   * point (no look-ahead). When a symbol has no Binance pair or the request
   * fails, the symbol is simply omitted — never filled with synthetic data.
   * Fields that cannot be derived for the chosen timeframe are NaN (sem dados).
   */
  async aggregateMarketData(symbols: string[], timeframe: string = '4h', _dataSource: 'binance' | 'coingecko' = 'binance'): Promise<Map<string, MarketDataPoint[]>> {
    const results = new Map<string, MarketDataPoint[]>();
    const intervalMs = INTERVAL_MS[timeframe];
    if (!intervalMs) {
      console.warn(`[dataAggregator] timeframe não suportado: ${timeframe}`);
      return results;
    }

    // One shared (cached) CoinGecko list for market cap — not one call per symbol.
    let caps = new Map<string, number>();
    try {
      const list = await fetchCryptoData('coingecko');
      caps = new Map(list.map(c => [c.symbol.toUpperCase(), Number(c.marketCap)]));
    } catch { /* market cap fica NaN */ }

    await Promise.all(symbols.map(async (raw) => {
      const symbol = raw.toUpperCase();
      if (STABLES.has(symbol)) return;
      try {
        const klines = await fetchKlines(`${symbol}USDT`, timeframe, { limit: HISTORY_BARS + WARMUP_BARS });
        const now = Date.now();
        const closed = klines.filter(k => k.closeTime < now); // descarta candle em formação
        if (closed.length < WARMUP_BARS + 1) return;

        const close = closed.map(k => parseFloat(k.close));
        const high = closed.map(k => parseFloat(k.high));
        const low = closed.map(k => parseFloat(k.low));
        const vol = closed.map(k => parseFloat(k.quoteAssetVolume)); // USDT
        const marketCap = caps.get(symbol) ?? NaN;
        const bars24h = Math.round(DAY_MS / intervalMs);
        const changeOver = (i: number, ms: number) => {
          const k = ms / intervalMs;
          if (!Number.isInteger(k) || k < 1 || i - k < 0) return NaN;
          return ((close[i] - close[i - k]) / close[i - k]) * 100;
        };

        const points: MarketDataPoint[] = [];
        for (let i = WARMUP_BARS; i < closed.length; i++) {
          const c = close.slice(0, i + 1);
          const rsiArr = calculateRSI(c, 14);
          const macd = calculateMACD(c);
          const bb = calculateBollingerBands(c, 20, 2);
          const volEma = calculateEMA(vol.slice(0, i + 1), 20);
          const rets: number[] = [];
          for (let j = Math.max(1, i - bars24h + 1); j <= i; j++) rets.push(Math.log(close[j] / close[j - 1]));
          const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
          const volat = rets.length >= 2
            ? Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1))
            : NaN;
          const vol24 = i - bars24h >= 0 ? vol.slice(i - bars24h + 1, i + 1).reduce((a, b) => a + b, 0) : NaN;
          const prevVol24 = i - 2 * bars24h >= 0 ? vol.slice(i - 2 * bars24h + 1, i - bars24h + 1).reduce((a, b) => a + b, 0) : NaN;
          const vEma = volEma[volEma.length - 1];

          points.push({
            symbol,
            timestamp: closed[i].closeTime,
            price: close[i],
            volume: vol[i],
            marketCap,
            rsi: rsiArr[rsiArr.length - 1],
            macd: {
              value: macd.macd[macd.macd.length - 1],
              signal: macd.signal[macd.signal.length - 1],
              histogram: macd.histogram[macd.histogram.length - 1],
            },
            ema9: last(calculateEMA(c, 9)),
            ema21: last(calculateEMA(c, 21)),
            ema50: last(calculateEMA(c, 50)),
            bollingerBands: bb,
            adx: calculateADX(high.slice(0, i + 1), low.slice(0, i + 1), c, 14),
            priceChange1h: changeOver(i, HOUR_MS),
            priceChange24h: changeOver(i, DAY_MS),
            priceChange7d: changeOver(i, 7 * DAY_MS),
            volatility24h: volat,
            volumeChange24h: prevVol24 > 0 ? ((vol24 - prevVol24) / prevVol24) * 100 : NaN,
            volumeEMA: vEma,
            volumeSpike: vEma > 0 && vol[i] > vEma * 2,
          });
        }

        results.set(symbol, points);
        this.marketDataCache.set(symbol, points);
      } catch (error) {
        // Sem par na Binance ou falha da fonte: ativo fica sem dados (não inventa série).
        console.warn(`[dataAggregator] sem dados reais para ${symbol}:`, error);
      }
    }));

    return results;
  }

  /** No on-chain provider is integrated here: returns an empty map (sem dados). */
  async generateOnChainMetrics(_symbols: string[]): Promise<Map<string, OnChainMetrics[]>> {
    return new Map();
  }

  /** No social provider is integrated: returns an empty map (sem dados). */
  async generateSocialMetrics(_symbols: string[]): Promise<Map<string, SocialMetrics[]>> {
    return new Map();
  }

  getMarketDataHistory(symbol: string): MarketDataPoint[] {
    return this.marketDataCache.get(symbol) || [];
  }

  getOnChainHistory(symbol: string): OnChainMetrics[] {
    return this.onChainCache.get(symbol) || [];
  }

  getSocialHistory(symbol: string): SocialMetrics[] {
    return this.socialCache.get(symbol) || [];
  }
}

export const dataAggregator = new DataAggregator();
