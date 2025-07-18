import { BinanceTicker } from '@/types/binance';

export const isValidTicker = (ticker: string): boolean => {
  // For now, consider all tickers valid to avoid filtering issues.
  // More specific validation can be added here if needed in the future.
  return true;
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