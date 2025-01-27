import { BinanceTicker, BinanceKline } from '@/types/binance';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export const fetchTickers = async (): Promise<Record<string, BinanceTicker>> => {
  const response = await fetch(`${BINANCE_API_URL}/ticker/24hr`);
  const data = await response.json();
  return data.reduce((acc: Record<string, BinanceTicker>, ticker: BinanceTicker) => {
    acc[ticker.symbol] = ticker;
    return acc;
  }, {});
};

export const fetchKlines = async (symbol: string, interval: string): Promise<BinanceKline[]> => {
  const response = await fetch(
    `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`
  );
  const data = await response.json();
  return data.map((kline: any[]) => ({
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
};