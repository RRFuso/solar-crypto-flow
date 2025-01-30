import { BinanceTicker } from '@/types/binance';

export const VALID_TICKERS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX',
  'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'ALGO', 'VET', 'FTM', 'NEAR', 'EGLD',
  'SAND', 'MANA', 'AXS', 'GALA', 'ROSE', 'ONE', 'CHZ', 'HOT', 'ENJ', 'CAKE'
];

export const isValidTicker = (symbol: string): boolean => {
  const base = symbol.replace('USDT', '');
  return VALID_TICKERS.includes(base);
};

export const filterValidTickers = (tickers: Record<string, BinanceTicker>): Record<string, BinanceTicker> => {
  const validTickers: Record<string, BinanceTicker> = {};
  
  Object.entries(tickers).forEach(([symbol, ticker]) => {
    if (symbol.endsWith('USDT') && isValidTicker(symbol)) {
      validTickers[symbol] = ticker;
    }
  });

  console.log(`Filtered ${Object.keys(validTickers).length} valid tickers from ${Object.keys(tickers).length} total`);
  return validTickers;
};