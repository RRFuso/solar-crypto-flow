import { useState, useEffect } from 'react';

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

      // Fetch 24h ticker data from Binance REST API
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const tickers = await response.json();

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
      const btcUsdtData = tickers.find((ticker: any) => ticker.symbol === 'BTCUSDT');
      const btcUsdt = btcUsdtData ? {
        price: btcUsdtData.lastPrice,
        priceChange: parseFloat(btcUsdtData.priceChangePercent),
        volume: btcUsdtData.volume,
        high24h: btcUsdtData.highPrice,
        low24h: btcUsdtData.lowPrice,
      } : data.btcUsdt;

      // Process top gainers
      const topGainers = [...tickers]
        .filter((ticker: any) => ticker.symbol.endsWith('BTC'))
        .sort((a: any, b: any) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .slice(0, 5)
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