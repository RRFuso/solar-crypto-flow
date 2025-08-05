
import { supabase } from '@/integrations/supabase/client';

export const fetchCoinGeckoData = async (endpoint: string, params?: Record<string, any>) => {
  try {
    const { data, error } = await supabase.functions.invoke('secure-coingecko-proxy', {
      body: { endpoint, params }
    });

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
