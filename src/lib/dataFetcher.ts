import { CryptoData, FlowData } from "@/types/crypto";
import { PriceActionSignal } from "@/hooks/usePriceActionSignals";
import { fetchTickers, fetchKlines } from './binance';
import { BinanceTicker, BinanceKline } from '@/types/binance';
import { fetchEtherscanData } from '@/services/etherscan';

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";

/**
 * Fetches cryptocurrency data from CoinGecko API
 */
export async function fetchCryptoDataCoinGecko(): Promise<CryptoData[]> {
  try {
    // Using the existing CoinGecko service with API key
    const { fetchCoinGeckoData } = await import('@/services/coingecko');
    // Fetch more coins to capture emerging opportunities
    const data = await fetchCoinGeckoData('/coins/markets', {
      vs_currency: 'usd',
      order: 'volume_desc', // Changed to volume to catch explosive movers
      per_page: 250,
      page: 1,
      sparkline: false,
      price_change_percentage: '1h,24h,7d'
    });
    
    const filteredData = data.filter((coin: any) => 
      coin.current_price != null && 
      coin.total_volume != null && 
      coin.market_cap != null &&
      coin.symbol != null
    );

    return filteredData.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      performance: coin.price_change_percentage_24h || 0,
      price: coin.current_price,
      volume: coin.total_volume,
      volume24h: coin.total_volume, // Add volume24h mapping
      marketCap: coin.market_cap,
      high24h: coin.high_24h || 0,
      low24h: coin.low_24h || 0,
      change24h: coin.price_change_percentage_24h || 0, // Add change24h mapping
      change7d: coin.price_change_percentage_7d_in_currency || 0, // Add change7d mapping
      priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
      priceChange24h: coin.price_change_percentage_24h || 0,
      priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
      volumeChange24h: coin.market_cap_change_percentage_24h ?? coin.price_change_percentage_24h ?? 0,
      category: determineCryptoCategory(coin.id),
      current_price: coin.current_price,
      total_volume: coin.total_volume,
      market_cap: coin.market_cap,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
    }));
  } catch (error) {
    console.error("Error fetching crypto data from CoinGecko:", error);
    return [];
  }
}

/**
 * Fetches cryptocurrency data from Binance API
 */
export async function fetchCryptoDataBinance(): Promise<CryptoData[]> {
  try {
    const tickers = await fetchTickers();
    const btcTicker = tickers['BTCUSDT'];
    const btcChange = btcTicker ? parseFloat(btcTicker.priceChangePercent) : 0;

    const cryptoData: CryptoData[] = Object.values(tickers).map((ticker: BinanceTicker) => {
      const priceChange = parseFloat(ticker.priceChangePercent);
      const performance = priceChange - btcChange;

      return {
        id: ticker.symbol,
        name: ticker.symbol,
        symbol: ticker.symbol,
        performance: performance,
        price: parseFloat(ticker.lastPrice),
        volume: parseFloat(ticker.volume),
        marketCap: parseFloat(ticker.quoteVolume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        priceChange24h: priceChange,
        volumeChange24h: 0,
        category: 'other',
      };
    });
    return cryptoData;
  } catch (error) {
    console.error("Error fetching crypto data from Binance:", error);
    return [];
  }
}

/**
 * Determine crypto category based on id/name (simplified)
 */
function determineCryptoCategory(id: string): string {
  const categories: Record<string, string[]> = {
    'layer1': ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 'near', 'binancecoin', 'ripple', 'tron', 'litecoin', 'cosmos'],
    'defi': ['uniswap', 'aave', 'maker', 'compound-governance-token', 'curve-dao-token', 'synthetix-network-token', 'pancakeswap-token', 'lido-dao', 'frax-share', 'thorchain', 'rocket-pool', 'sushi'],
    'memecoin': ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifhat', 'bonk'],
    'stablecoin': ['tether', 'usd-coin', 'dai', 'true-usd', 'binance-usd', 'frax'],
    'gaming': ['the-sandbox', 'decentraland', 'axie-infinity', 'gala', 'enjincoin', 'immutable-x', 'render-token'],
    'privacy': ['monero', 'zcash', 'dash', 'secret', 'oasis-network'],
    'ai': ['fetch-ai', 'singularitynet', 'ocean-protocol', 'bittensor', 'render-token', 'the-graph'],
    'rwa': ['centrifuge', 'maple', 'ondo-finance', 'pendle'],
    'infrastructure': ['chainlink', 'the-graph', 'filecoin', 'arweave', 'hedera-hashgraph', 'internet-computer'],
    'layer2': ['optimism', 'arbitrum', 'matic-network', 'starknet', 'immutable-x', 'manta-network']
  };

  for (const [category, cryptos] of Object.entries(categories)) {
    if (cryptos.includes(id)) {
      return category;
    }
  }
  if (id.includes('wrapped')) return 'other';
  if (id.includes('staked')) return 'defi';
  
  return 'other';
}

/**
 * Generates capital flow data between cryptocurrencies based on market dynamics.
 * This version uses price performance, volume, and price action signals to estimate flows.
 */
export async function fetchCapitalFlows(
  cryptos: CryptoData[], 
  priceActionSignals: Map<string, PriceActionSignal> | null, // Accept signals
  maxFlows: number = 50
): Promise<FlowData[]> {
  const potentialFlows: FlowData[] = [];
  const minVolumeThreshold = 100000;
  const minMarketCapThreshold = 5000000;

  for (let i = 0; i < cryptos.length; i++) {
    const source = cryptos[i];
    const sourceSymbol = source.symbol || '';

    if (source.category === 'stablecoin' || 
        (source.volume || 0) < minVolumeThreshold || 
        (source.marketCap || 0) < minMarketCapThreshold) {
      continue;
    }

    for (let j = 0; j < cryptos.length; j++) {
      if (i === j) continue;
      const target = cryptos[j];
      const targetSymbol = target.symbol || '';

      if ((target.volume || 0) < minVolumeThreshold || 
          (target.category !== 'stablecoin' && (target.marketCap || 0) < minMarketCapThreshold)) {
        continue;
      }

      const sourcePerf = source.priceChange24h || 0;
      const targetPerf = target.priceChange24h || 0;
      const perfDiff = targetPerf - sourcePerf;

      if (Math.abs(perfDiff) > 0.5) {
        const sourceLogVol = Math.log10((source.volume || 0) + 1);
        const targetLogVol = Math.log10((target.volume || 0) + 1);
        let flowStrength = Math.abs(perfDiff) * (sourceLogVol + targetLogVol);

        // --- Price Action Signal Integration --- 
        const sourceSignal = priceActionSignals?.get(sourceSymbol);
        const targetSignal = priceActionSignals?.get(targetSymbol);
        let signalBoost = 1.0;

        // Boost if source/target has high/medium potential or breakout
        const hasSignificantSignal = (signal: PriceActionSignal | undefined) => 
          signal && (signal.explosivePotential === 'High' || signal.explosivePotential === 'Medium' || signal.isBreakout);

        if (hasSignificantSignal(sourceSignal) || hasSignificantSignal(targetSignal)) {
           // Strong boost if flow is towards the asset with the signal
           if (perfDiff > 0 && hasSignificantSignal(targetSignal)) {
               signalBoost = 2.5; 
           } else if (perfDiff < 0 && hasSignificantSignal(sourceSignal)) {
               signalBoost = 2.0; // Slightly smaller boost for outflow from signaled asset
           } else {
               signalBoost = 1.5; // General boost if either has a signal
           }
        }
        // Apply the boost
        flowStrength *= signalBoost;
        // --- End Price Action Integration ---

        if (perfDiff > 0 && sourcePerf < 0) {
          flowStrength *= 1.5;
        } else if (perfDiff < 0 && sourcePerf > 0) {
          flowStrength *= 1.2;
        }
        
        let flowValue = flowStrength * ((source.volume || 0) * 0.0005);
        flowValue = Math.min(flowValue, (source.marketCap || 0) * 0.01);
        const finalFlowValue = perfDiff > 0 ? flowValue : -flowValue;
        const percentage = ((source.marketCap || 1) > 0) ? (flowValue / (source.marketCap || 1)) * 100 * (perfDiff > 0 ? 1 : -1) : 0;

        potentialFlows.push({
          id: `${sourceSymbol}-${targetSymbol}-${Date.now()}`,
          from: sourceSymbol,
          to: targetSymbol,
          value: finalFlowValue,
          percentage: isNaN(percentage) ? 0 : percentage,
          volume: flowValue,
          fromCategory: source.category || 'other',
          toCategory: target.category || 'other'
        });
      }
    }
  }

  return potentialFlows
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, maxFlows);
}

const BINANCE_INTERVALS: Record<string, string> = {
  '5m': '5m', '15m': '15m', '30m': '30m', '1h': '1h', '4h': '4h', '24h': '1d', '1d': '1d', '7d': '1w',
};

function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

function rsiOf(closes: number[], period = 14): number {
  if (closes.length <= period) return NaN;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(0, d)) / period;
    loss = (loss * (period - 1) + Math.max(0, -d)) / period;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

async function fetchSpotKlines(symbol: string, interval: string): Promise<{ close: number; volume: number }[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol.toUpperCase())}USDT&interval=${interval}&limit=120`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance klines ${res.status}`);
  const rows = (await res.json()) as unknown[][];
  return rows.map(r => ({ close: Number(r[4]), volume: Number(r[5]) }));
}

/**
 * Technical indicators computed from real Binance spot klines (SYMBOLUSDT).
 * When data is unavailable, values are NaN and `available` is false —
 * callers must treat that as "sem dados", never as neutral.
 */
export async function fetchTechnicalIndicators(
  symbol: string,
  timeframe: string = '4h'
): Promise<{
  rsi: number;
  rsi4h: number;
  macd: { value: number; signal: number; histogram: number };
  ema12: number;
  ema26: number;
  obv: number;
  available: boolean;
  source: string;
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();
  const empty = {
    rsi: NaN, rsi4h: NaN, macd: { value: NaN, signal: NaN, histogram: NaN },
    ema12: NaN, ema26: NaN, obv: NaN, available: false, source: 'binance-spot', fetchedAt,
  };
  try {
    const interval = BINANCE_INTERVALS[timeframe] ?? '4h';
    const k = await fetchSpotKlines(symbol, interval);
    if (k.length < 30) return empty;
    const closes = k.map(x => x.close);
    const e12 = emaSeries(closes, 12);
    const e26 = emaSeries(closes, 26);
    const macdLine = closes.map((_, i) => e12[i] - e26[i]);
    const signal = emaSeries(macdLine, 9);
    let obv = 0;
    for (let i = 1; i < k.length; i++) {
      if (closes[i] > closes[i - 1]) obv += k[i].volume;
      else if (closes[i] < closes[i - 1]) obv -= k[i].volume;
    }
    const last = closes.length - 1;
    const rsi = rsiOf(closes);
    let rsi4h = rsi;
    if (interval !== '4h') {
      try { rsi4h = rsiOf((await fetchSpotKlines(symbol, '4h')).map(x => x.close)); } catch { rsi4h = NaN; }
    }
    return {
      rsi, rsi4h,
      macd: { value: macdLine[last], signal: signal[last], histogram: macdLine[last] - signal[last] },
      ema12: e12[last], ema26: e26[last], obv, available: true, source: 'binance-spot', fetchedAt,
    };
  } catch (err) {
    console.warn(`[indicators] sem dados para ${symbol}:`, err);
    return empty;
  }
}

/**
 * On-chain exchange flows are NOT available from this path (Etherscan balance
 * only). Flow fields are null — never simulated. Use the smart-money oracle
 * for observed flows.
 */
export async function fetchOnChainData(contractInfo: { address: string; chain: string }): Promise<{
  exchangeInflow: number | null;
  exchangeOutflow: number | null;
  fundingRate: number | null;
  netFlow: number | null;
  balance: string | null;
  available: boolean;
}> {
  try {
    const { fetchEtherscanData } = await import('@/services/etherscan');
    const balanceWei = await fetchEtherscanData({
      module: 'account', action: 'balance', address: contractInfo.address, tag: 'latest',
    }, 1);
    return {
      exchangeInflow: null, exchangeOutflow: null, fundingRate: null, netFlow: null,
      balance: balanceWei ? (parseInt(balanceWei) / 1e18).toFixed(4) : null,
      available: false,
    };
  } catch (error) {
    console.error(`Error fetching on-chain data for ${contractInfo.address}:`, error);
    return { exchangeInflow: null, exchangeOutflow: null, fundingRate: null, netFlow: null, balance: null, available: false };
  }
}

/**
 * Unified function to fetch cryptocurrency data from either CoinGecko or Binance.
 * Defaults to CoinGecko.
 */
export async function fetchCryptoData(dataSource: 'coingecko' | 'binance' = 'coingecko'): Promise<CryptoData[]> {
  if (dataSource === 'binance') {
    return fetchCryptoDataBinance();
  } else {
    return fetchCryptoDataCoinGecko();
  }
}