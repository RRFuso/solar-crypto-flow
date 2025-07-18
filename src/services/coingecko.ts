
import axios from 'axios';

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-2GUE8CoGiFxsBtGVK8aS7FJD'; // Provided by the user

export const fetchCoinGeckoData = async (endpoint: string, params?: Record<string, any>) => {
  try {
    const response = await axios.get(`${COINGECKO_API_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        x_cg_demo_api_key: API_KEY, // Use the provided API key
      },
    });
    return response.data;
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
