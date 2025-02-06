import { BinanceTicker, BinanceKline } from '@/types/binance';
import { filterValidTickers } from './tickerValidation';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  let lastError: Error | null = null;
  
  // First try direct fetch
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (response.ok) {
        return response;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      if (i < retries - 1) {
        await sleep(Math.min(1000 * Math.pow(2, i), 10000)); // Exponential backoff, max 10s
      }
    }
  }

  // If direct fetch fails, try with CORS proxy
  try {
    console.log('Trying CORS proxy...');
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Proxy HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (proxyError) {
    console.error('Both direct and proxy requests failed:', proxyError);
    throw lastError || proxyError;
  }
};

export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  try {
    console.log('Fetching tickers from Binance...');
    const response = await fetchWithRetry(`${BINANCE_API_URL}/ticker/24hr`, {
      method: 'GET',
    });
    
    const data: BinanceTicker[] = await response.json();
    const allTickers = data.reduce((acc: Record<string, BinanceTicker>, ticker: BinanceTicker) => {
      acc[ticker.symbol] = ticker;
      return acc;
    }, {});

    return filterValidTickers(allTickers);
  } catch (error) {
    console.error('Error fetching tickers:', error);
    throw error;
  }
};

export const fetchKlines = async (symbol: string, interval: string): Promise<BinanceKline[]> => {
  try {
    console.log(`Fetching klines for ${symbol}...`);
    const response = await fetchWithRetry(
      `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    console.log(`Successfully fetched klines for ${symbol}`);
    
    return data.map((kline: any[]): BinanceKline => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      trades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10]
    }));
  } catch (error) {
    console.error('Error fetching klines:', error);
    throw error;
  }
};