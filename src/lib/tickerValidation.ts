import { BinanceTicker } from '@/types/binance';

interface TickerValidationResult {
  validTickers: string[];
  invalidTickers: {
    symbol: string;
    reason: string;
  }[];
}

// Known valid base currencies that TradingView supports
const VALID_BASE_CURRENCIES = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC',
  'AVAX', 'LINK', 'DOT', 'UNI', 'LTC', 'ATOM', 'ETC', 'XLM',
  'ALGO', 'NEAR', 'FTM', 'SAND', 'MANA', 'AXS', 'FIL', 'AAVE',
  'GRT', 'SNX', 'COMP', 'MKR', 'YFI', '1INCH', 'ENJ', 'CAKE',
  'CHZ', 'HOT', 'ONE', 'AUDIO', 'ALPHA', 'KAVA', 'BAND', 'REN'
];

export const validateTicker = (symbol: string): boolean => {
  // Remove USDT suffix for validation
  const baseSymbol = symbol.replace('USDT', '');
  return VALID_BASE_CURRENCIES.includes(baseSymbol);
};

export const filterValidTickers = (tickers: Record<string, BinanceTicker>): TickerValidationResult => {
  const result: TickerValidationResult = {
    validTickers: [],
    invalidTickers: []
  };

  Object.entries(tickers).forEach(([symbol, ticker]) => {
    // Only process USDT pairs
    if (!symbol.endsWith('USDT')) {
      result.invalidTickers.push({
        symbol,
        reason: 'Not a USDT pair'
      });
      return;
    }

    if (validateTicker(symbol)) {
      result.validTickers.push(symbol);
    } else {
      result.invalidTickers.push({
        symbol,
        reason: 'Not supported by TradingView'
      });
    }
  });

  // Log validation results
  console.log(`Validated ${Object.keys(tickers).length} tickers:`);
  console.log(`- Valid: ${result.validTickers.length}`);
  console.log(`- Invalid: ${result.invalidTickers.length}`);
  console.log('Invalid tickers:', result.invalidTickers);

  return result;
};