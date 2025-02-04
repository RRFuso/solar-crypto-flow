import { BinanceTicker, BinanceKline } from '@/types/binance';
import { filterValidTickers } from './tickerValidation';

// Using api3.binance.com which is more reliable
const BINANCE_API_URL = 'https://api3.binance.com/api/v3';

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        // If all retries fail, try the proxy immediately
        if (url.startsWith(BINANCE_API_URL)) {
          console.log('All direct requests failed, trying proxy...');
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          return fetch(proxyUrl, { 
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          });
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
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
    const url = `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`;
    
    try {
      const response = await fetchWithRetry(url, { method: 'GET' });
      const data = await response.json();
      return parseKlinesData(data);
    } catch (error) {
      console.error(`Failed to fetch klines for ${symbol}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error in fetchKlines:', error);
    throw error;
  }
};

const parseKlinesData = (data: any[]): BinanceKline[] => {
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
};