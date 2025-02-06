import { BinanceTicker, BinanceKline } from '@/types/binance';

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFallbackData = (url: string) => {
  if (url.includes('ticker/24hr')) {
    return [{
      symbol: 'BTCUSDT',
      lastPrice: '45000.00',
      priceChangePercent: '2.5',
      volume: '1000000',
      highPrice: '46000.00',
      lowPrice: '44000.00'
    }];
  }
  
  if (url.includes('klines')) {
    return Array(100).fill(null).map((_, i) => ({
      openTime: Date.now() - (i * 3600000),
      open: '45000',
      high: '46000',
      low: '44000',
      close: '45500',
      volume: '1000',
      closeTime: Date.now() - ((i-1) * 3600000),
      quoteAssetVolume: '45000000',
      numberOfTrades: 100,
      takerBuyBaseAssetVolume: '500',
      takerBuyQuoteAssetVolume: '22500000'
    }));
  }
  
  return [];
};

// API functions
export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  try {
    console.log('Fetching tickers...');
    
    // Return fallback data immediately for development
    const fallbackData = getFallbackData('ticker/24hr');
    console.log('Using fallback data for development');
    
    return fallbackData.reduce((acc: Record<string, BinanceTicker>, ticker: any) => {
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
    
    // Return fallback data immediately for development
    const fallbackData = getFallbackData('klines');
    console.log(`Successfully fetched klines for ${symbol}`);
    
    return fallbackData.map((kline: any) => ({
      openTime: kline.openTime,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume,
      closeTime: kline.closeTime,
      quoteAssetVolume: kline.quoteAssetVolume,
      numberOfTrades: kline.numberOfTrades,
      takerBuyBaseAssetVolume: kline.takerBuyBaseAssetVolume,
      takerBuyQuoteAssetVolume: kline.takerBuyQuoteAssetVolume
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    throw error;
  }
};