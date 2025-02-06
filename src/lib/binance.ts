import { BinanceTicker, BinanceKline } from '@/types/binance';

// Mock data for development
const mockTickers: Record<string, BinanceTicker> = {
  'BTCUSDT': {
    symbol: 'BTCUSDT',
    lastPrice: '45000.00',
    priceChangePercent: '2.5',
    volume: '1000000',
    highPrice: '46000.00',
    lowPrice: '44000.00'
  }
};

const mockKlines: BinanceKline[] = Array(100).fill(null).map((_, i) => ({
  openTime: Date.now() - (i * 3600000),
  open: '45000',
  high: '46000',
  low: '44000',
  close: '45500',
  volume: '1000',
  closeTime: Date.now() - ((i-1) * 3600000),
  quoteAssetVolume: '45000000',
  trades: 100,
  takerBuyBaseAssetVolume: '500',
  takerBuyQuoteAssetVolume: '22500000'
}));

// API functions
export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  try {
    console.log('Fetching tickers...');
    
    // Return mock data for development
    console.log('Using fallback data for development');
    return mockTickers;
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return mockTickers; // Return mock data on error
  }
};

export const fetchKlines = async (
  symbol: string,
  interval: string
): Promise<BinanceKline[]> => {
  try {
    console.log(`Fetching klines for ${symbol}...`);
    
    // Return mock data for development
    console.log(`Successfully fetched klines for ${symbol}`);
    return mockKlines;
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return mockKlines; // Return mock data on error
  }
};