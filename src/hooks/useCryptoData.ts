import { useState, useEffect } from 'react';
import { Spot } from '@binance/connector';

const client = new Spot();

interface CryptoData {
  altBtcPairs: Array<{
    symbol: string;
    price: string;
    priceChange: number;
    volume: string;
    lastPeak?: string;
  }>;
  btcUsdt: {
    price: string;
    priceChange: number;
    volume: string;
    high24h: string;
    low24h: string;
  };
  topGainers: Array<{
    symbol: string;
    priceChange: number;
    volume: string;
  }>;
}

export const useCryptoData = () => {
  const [data, setData] = useState<CryptoData>({
    altBtcPairs: [],
    btcUsdt: {
      price: '0',
      priceChange: 0,
      volume: '0',
      high24h: '0',
      low24h: '0',
    },
    topGainers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch 24h ticker price change statistics
      const [tickerResponse, btcResponse] = await Promise.all([
        client.ticker24hr(),
        client.ticker24hr('BTCUSDT'),
      ]);

      const tickers = tickerResponse.data;
      const btcTicker = btcResponse.data;

      // Process BTC pairs
      const altBtcPairs = tickers
        .filter((ticker: any) => ticker.symbol.endsWith('BTC'))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          priceChange: parseFloat(ticker.priceChangePercent),
          volume: ticker.volume,
          lastPeak: ticker.highPrice,
        }));

      // Process BTC/USDT data
      const btcUsdt = {
        price: btcTicker.lastPrice,
        priceChange: parseFloat(btcTicker.priceChangePercent),
        volume: btcTicker.volume,
        high24h: btcTicker.highPrice,
        low24h: btcTicker.lowPrice,
      };

      // Process top gainers
      const topGainers = [...tickers]
        .filter((ticker: any) => ticker.symbol.endsWith('BTC'))
        .sort((a: any, b: any) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          priceChange: parseFloat(ticker.priceChangePercent),
          volume: ticker.volume,
        }));

      setData({
        altBtcPairs,
        btcUsdt,
        topGainers,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
};