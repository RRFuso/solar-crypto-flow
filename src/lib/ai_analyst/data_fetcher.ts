import { FearGreedIndex, LongShortRatio } from "@/types/crypto";

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Helper function to fetch from a URL and parse JSON
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
  }
  return response.json();
}

// Fetch Fear & Greed Index
export async function getFearGreedIndex(): Promise<FearGreedIndex[]> {
  const data = await fetchJson<{ data: FearGreedIndex[] }>('https://api.alternative.me/fng/?limit=10');
  return data.data;
}

// Fetch Long/Short Ratio from Binance
export async function getLongShortRatio(symbol: string = 'BTCUSDT', period: string = '1h'): Promise<any> {
    const url = `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`;
    const data = await fetchJson<any>(url);
    return data;
}

// Fetch stock data from Alpha Vantage
export async function getStockData(symbol: string): Promise<any> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('Alpha Vantage API key not found in environment variables.');
  }
  const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  return fetchJson(url);
}

// Fetch commodity data from Alpha Vantage
export async function getCommodityData(commodity: 'GOLD'): Promise<any> {
    if (!ALPHA_VANTAGE_API_KEY) {
        throw new Error('Alpha Vantage API key not found in environment variables.');
    }
    let functionName = '';
    switch (commodity) {
        case 'GOLD':
            functionName = 'GOLD';
            break;
        default:
            throw new Error('Unsupported commodity.');
    }

    const url = `${ALPHA_VANTAGE_BASE_URL}?function=${functionName}&interval=daily&apikey=${ALPHA_VANTAGE_API_KEY}`;
    return fetchJson(url);
}

// A single function to fetch all external data
export async function fetchAllExternalData() {
  try {
    const [
      fearGreedIndex,
      longShortRatio,
      sp500,
      nasdaq,
      russell,
      nvidia,
      gold
    ] = await Promise.all([
      getFearGreedIndex(),
      getLongShortRatio('BTCUSDT'),
      getStockData('SPY'), // SPDR S&P 500 ETF
      getStockData('QQQ'), // Invesco QQQ Trust (Nasdaq-100)
      getStockData('IWM'), // iShares Russell 2000 ETF
      getStockData('NVDA'),
      getCommodityData('GOLD')
    ]);

    return {
      fearGreedIndex,
      longShortRatio,
      sp500,
      nasdaq,
      russell,
      nvidia,
      gold
    };
  } catch (error) {
    console.error("Error fetching external data:", error);
    throw error;
  }
}
