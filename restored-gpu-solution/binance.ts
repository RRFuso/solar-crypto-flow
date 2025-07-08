import { BinanceTicker, BinanceKline } from '@/types/binance';
import { filterValidTickers } from './tickerValidation';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      // First try proxy to handle CORS issues
      const proxyResponse = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (proxyResponse.ok) {
        return proxyResponse;
      }

      // If proxy fails, try direct fetch as fallback
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error as Error;
      
      if (i < retries - 1) {
        // Wait before retrying, with exponential backoff
        await sleep(1000 * Math.pow(2, i));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
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

interface KlinesOptions {
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export const fetchKlines = async (symbol: string, interval: string, options?: KlinesOptions): Promise<BinanceKline[]> => {
  try {
    console.log(`Fetching klines for ${symbol}...`);
    const params = new URLSearchParams({
      symbol,
      interval,
      limit: String(options?.limit || 100),
    });

    if (options?.startTime) {
      params.append('startTime', String(options.startTime));
    }
    if (options?.endTime) {
      params.append('endTime', String(options.endTime));
    }

    const response = await fetchWithRetry(
      `${BINANCE_API_URL}/klines?${params.toString()}`,
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

