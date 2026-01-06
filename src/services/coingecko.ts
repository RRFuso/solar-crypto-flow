import { supabase } from '@/integrations/supabase/client';
import { ApiUsageTracker } from './api-usage-tracker';

export const fetchCoinGeckoData = async (endpoint: string, params?: Record<string, any>) => {
  const startTime = performance.now();
  
  try {
    const { data, error } = await supabase.functions.invoke('secure-coingecko-proxy', {
      body: { endpoint, params }
    });

    const responseTime = performance.now() - startTime;
    
    // Track request - proxy handles caching, assume live for tracking
    ApiUsageTracker.trackRequest('coingecko', endpoint, false, responseTime);

    if (error) {
      console.error(`Error calling CoinGecko proxy for endpoint ${endpoint}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching data from CoinGecko API for endpoint ${endpoint}:`, error);
    throw error;
  }
};

export const getCoinList = async () => {
  return fetchCoinGeckoData('/coins/list');
};

export const getCoinMarketChart = async (id: string, vs_currency: string = 'usd', days: string = 'max') => {
  return fetchCoinGeckoData(`/coins/${id}/market_chart`, { vs_currency, days });
};

export const getCoinData = async (id: string) => {
  return fetchCoinGeckoData(`/coins/${id}`);
};

export const getTrendingCoins = async () => {
  return fetchCoinGeckoData('/search/trending');
};

export const getGlobalData = async () => {
  return fetchCoinGeckoData('/global');
};

export const getMarkets = async (params: Record<string, any> = {}) => {
  const defaultParams = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 500,
    page: 1,
    sparkline: false,
    price_change_percentage: '1h,24h,7d'
  };
  return fetchCoinGeckoData('/coins/markets', { ...defaultParams, ...params });
};
