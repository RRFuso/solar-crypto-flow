import { supabase } from '@/integrations/supabase/client';
import { fetchCoinGeckoData } from '@/services/coingecko';
import { ApiUsageTracker } from './api-usage-tracker';

export type FlowSentiment = 'Bullish' | 'Bearish' | 'Neutral';

export interface FlowMetrics {
  symbol: string;
  netFlow: number;
  inflow: number;
  outflow: number;
  sentiment: FlowSentiment;
}

interface TradingViewSymbolMap {
  coingecko_id: string;
  tradingview_symbol: string;
}

// Map TradingView symbols (e.g., BTC, ETH) to CoinGecko IDs using Supabase table
async function mapSymbolsToCoinGeckoIds(symbols: string[]): Promise<Map<string, string>> {
  if (!symbols.length) return new Map();

  const { data, error } = await supabase
    .from('tradingview_symbol_map')
    .select('coingecko_id, tradingview_symbol')
    .in('tradingview_symbol', symbols.map((s) => s.toUpperCase()));

  if (error) {
    console.error('[onchain-coingecko] Failed to load tradingview_symbol_map:', error);
    return new Map();
  }

  const map = new Map<string, string>();
  data?.forEach((row) => {
    map.set(row.tradingview_symbol.toUpperCase(), row.coingecko_id);
  });
  return map;
}

// Compute flow metrics from CoinGecko markets data
function computeFlowFromMarket(coin: any): { netFlow: number; inflow: number; outflow: number; sentiment: FlowSentiment } {
  const mcChange = Number(coin?.market_cap_change_24h ?? 0);
  const netFlow = isFinite(mcChange) ? mcChange : 0;
  const inflow = Math.max(0, netFlow);
  const outflow = Math.max(0, -netFlow);
  // Convention: net outflow from market cap change is often bullish (supply leaving exchanges)
  const sentiment: FlowSentiment = netFlow < 0 ? 'Bullish' : netFlow > 0 ? 'Bearish' : 'Neutral';
  return { netFlow, inflow, outflow, sentiment };
}

export async function getFlowMetricsForSymbols(symbols: string[]): Promise<Map<string, FlowMetrics>> {
  const result = new Map<string, FlowMetrics>();
  if (!symbols.length) return result;

  // Map to CoinGecko IDs
  const idMap = await mapSymbolsToCoinGeckoIds(symbols);
  const ids = [...new Set(symbols.map((s) => idMap.get(s.toUpperCase())).filter(Boolean) as string[])];

  if (!ids.length) {
    // No mappings found; default to neutral zeros
    symbols.forEach((s) => {
      result.set(s, { symbol: s, netFlow: 0, inflow: 0, outflow: 0, sentiment: 'Neutral' });
    });
    return result;
  }

  // Fetch market data for the mapped IDs
  const markets = await fetchCoinGeckoData('/coins/markets', {
    vs_currency: 'usd',
    ids: ids.join(','),
    order: 'market_cap_desc',
    per_page: ids.length,
    sparkline: false,
    price_change_percentage: '1h,24h,7d',
  });

  const byId = new Map<string, any>();
  (markets || []).forEach((coin: any) => byId.set(String(coin.id), coin));

  symbols.forEach((s) => {
    const id = idMap.get(s.toUpperCase());
    const coin = id ? byId.get(id) : undefined;
    const { netFlow, inflow, outflow, sentiment } = computeFlowFromMarket(coin);
    result.set(s, { symbol: s, netFlow, inflow, outflow, sentiment });
  });

  return result;
}
