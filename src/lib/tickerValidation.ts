import { BinanceTicker } from '@/types/binance';

export const isValidTicker = (ticker: string): boolean => {
  // Check if ticker follows valid format (e.g., BTCUSDT)
  const validFormat = /^[A-Z0-9]+USDT$/.test(ticker);
  
  // Add any additional validation rules here
  return validFormat;
};

export const filterValidTickers = (tickers: Record<string, BinanceTicker>): Record<string, BinanceTicker> => {
  console.log('Filtering valid tickers...');
  
  const validTickers: Record<string, BinanceTicker> = {};
  const invalidTickers: string[] = [];

  Object.entries(tickers).forEach(([symbol, ticker]) => {
    if (isValidTicker(symbol)) {
      validTickers[symbol] = ticker;
    } else {
      invalidTickers.push(symbol);
      console.log(`Invalid ticker filtered out: ${symbol}`);
    }
  });

  console.log(`Total valid tickers: ${Object.keys(validTickers).length}`);
  console.log(`Total invalid tickers: ${invalidTickers.length}`);
  
  return validTickers;
};