import { useQuery } from '@tanstack/react-query';
import { fetchTickers, fetchKlines } from '@/lib/binance';
import { calculateRSI, calculateEMA } from '@/lib/technicalAnalysis';
import { CryptoData } from '@/types/crypto';

interface CryptoDataOptions {
  timeframe?: string;
  rsiOverbought?: number;
  rsiOversold?: number;
}

export const useCryptoData = (options: CryptoDataOptions = {}) => {
  const {
    timeframe = '4h',
    rsiOverbought = 70,
    rsiOversold = 30
  } = options;

  return useQuery({
    queryKey: ['cryptos', timeframe, rsiOverbought, rsiOversold],
    queryFn: async () => {
      const tickers = await fetchTickers();
      const btcPrice = parseFloat(tickers['BTCUSDT'].lastPrice);
      const btcChange = parseFloat(tickers['BTCUSDT'].priceChangePercent);

      const usdtPairs = Object.entries(tickers)
        .filter(([symbol]) => symbol.endsWith('USDT'))
        .map(async ([symbol, ticker]) => {
          const klines = await fetchKlines(symbol, timeframe);
          const prices = klines.map(k => parseFloat(k[4])); // Close prices
          
          const rsi = calculateRSI(prices);
          const ema12 = calculateEMA(prices, 12);
          const ema26 = calculateEMA(prices, 26);
          const ma14 = calculateEMA(prices, 14);
          
          const currentPrice = parseFloat(ticker.lastPrice);
          const priceChange = parseFloat(ticker.priceChangePercent);
          
          return {
            id: symbol.replace('USDT', ''),
            name: symbol.replace('USDT', ''),
            performance: priceChange - btcChange,
            price: currentPrice.toFixed(8),
            rsi: rsi[rsi.length - 1],
            rsi4h: rsi[rsi.length - 1],
            ema12: ema12[ema12.length - 1],
            ema26: ema26[ema26.length - 1],
            aboveMA14: currentPrice > ma14[ma14.length - 1],
            volume: ticker.volume,
            high24h: ticker.highPrice,
            low24h: ticker.lowPrice
          } as CryptoData;
        });

      return Promise.all(usdtPairs);
    },
    refetchInterval: 15000 // Atualiza a cada 15 segundos
  });
};