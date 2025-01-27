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

export const fetchKlines = async (symbol: string, interval: string): Promise<number[][]> => {
  const response = await fetch(
    `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=100`
  );
  const data = await response.json();
  return data;
};