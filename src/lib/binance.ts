import { BinanceKline, BinanceTicker } from '@/types/binance';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-proxy.htmldriven.com/?url=',
  'https://cors-anywhere.herokuapp.com/'
];

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createProxyUrl = (url: string, proxyIndex: number = 0) => {
  if (proxyIndex >= CORS_PROXIES.length) {
    return url; // Fallback to direct URL if all proxies fail
  }
  return `${CORS_PROXIES[proxyIndex]}${encodeURIComponent(url)}`;
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    for (let proxyIndex = 0; proxyIndex < CORS_PROXIES.length; proxyIndex++) {
      try {
        console.log(`Attempt ${i + 1} using proxy ${proxyIndex + 1}...`);
        const proxyUrl = createProxyUrl(url, proxyIndex);
        
        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin,
            ...options.headers,
          },
        });

        if (response.ok) {
          return response;
        }

        console.log(`Proxy ${proxyIndex + 1} failed with status ${response.status}`);
      } catch (error) {
        console.error(`Error with proxy ${proxyIndex + 1}:`, error);
        lastError = error as Error;
      }
    }

    // If all proxies failed, try direct request with no-cors
    if (i === retries - 1) {
      try {
        console.log('All proxies failed, trying direct request with no-cors...');
        const response = await fetch(url, {
          ...options,
          mode: 'no-cors',
          headers: {
            'Accept': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.error('Direct request failed:', error);
        lastError = error as Error;
      }
    }

    const delay = Math.min(1000 * Math.pow(2, i), 10000);
    console.log(`Waiting ${delay}ms before retry...`);
    await sleep(delay);
  }

  throw lastError || new Error('All fetch attempts failed');
};

// API functions
export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  try {
    console.log('Fetching tickers from Binance...');
    const response = await fetchWithRetry(`${BINANCE_API_URL}/ticker/24hr`);
    const data: BinanceTicker[] = await response.json();
    
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
    const data = await response.json();
    
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