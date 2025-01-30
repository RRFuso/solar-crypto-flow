import { BinanceTicker, BinanceKline } from '@/types/binance';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
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
    console.log('Successfully fetched tickers');
    
    return data.reduce((acc: Record<string, BinanceTicker>, ticker: BinanceTicker) => {
      acc[ticker.symbol] = ticker;
      return acc;
    }, {});
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