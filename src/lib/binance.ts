import { BinanceKline, BinanceTicker } from '@/types/binance';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const PROXY_URL = 'https://api.allorigins.win/raw?url=';

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createProxyUrl = (url: string) => `${PROXY_URL}${encodeURIComponent(url)}`;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Fetch functions with retries
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Try proxy first
      console.log(`Attempt ${i + 1} using CORS proxy...`);
      const proxyResponse = await fetch(createProxyUrl(url), {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (proxyResponse.ok) {
        return proxyResponse;
      }

      // If proxy fails, try direct
      console.log('Proxy failed, trying direct fetch...');
      const directResponse = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      if (directResponse.ok) {
        return directResponse;
      }

      throw new Error(`HTTP error! status: ${directResponse.status}`);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries reached');
};

// API functions
export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  try {
    console.log('Fetching tickers from Binance...');
    const response = await fetchWithRetry(`${BINANCE_API_URL}/ticker/24hr`);
    const data: BinanceTicker[] = await handleResponse(response);
    
    console.log(`Successfully fetched ${data.length} tickers`);
    
    return data.reduce((acc: Record<string, BinanceTicker>, ticker: BinanceTicker) => {
      acc[ticker.symbol] = ticker;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching tickers:', error);
    throw error;
  }
};

export const fetchKlines = async (
  symbol: string,
  interval: string
): Promise<BinanceKline[]> => {
  try {
    console.log(`Fetching klines for ${symbol}...`);
    const url = `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`;
    const response = await fetchWithRetry(url);
    const data = await handleResponse(response);
    
    console.log(`Successfully fetched klines for ${symbol}`);
    
    return data.map((kline: any[]) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10]
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    throw error;
  }
};