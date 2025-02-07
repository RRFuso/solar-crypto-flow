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
      console.log('Fetching crypto data...');
      const tickers = await fetchTickers();
      const btcTicker = tickers['BTCUSDT'];
      
      if (!btcTicker) {
        console.error('BTC ticker not found');
        return [];
      }

      const btcChange = parseFloat(btcTicker.priceChangePercent);

      const usdtPairs = await Promise.all(
        Object.entries(tickers)
          .filter(([symbol]) => symbol.endsWith('USDT'))
          .map(async ([symbol, ticker]) => {
            try {
              console.log(`Fetching klines for ${symbol}...`);
              const klines = await fetchKlines(symbol, timeframe);
              
              if (!klines || klines.length === 0) {
                console.log(`No klines data for ${symbol}`);
                return null;
              }

              const prices = klines.map(k => parseFloat(k.close));
              
              const rsiValues = calculateRSI(prices);
              const ema12Values = calculateEMA(prices, 12);
              const ema26Values = calculateEMA(prices, 26);
              const ma14Values = calculateEMA(prices, 14);
              
              const currentPrice = parseFloat(ticker.lastPrice);
              const priceChange = parseFloat(ticker.priceChangePercent);
              
              if (isNaN(currentPrice) || isNaN(priceChange)) {
                console.log(`Invalid price data for ${symbol}`);
                return null;
              }

              return {
                id: symbol.replace('USDT', ''),
                name: symbol.replace('USDT', ''),
                performance: priceChange - btcChange,
                price: currentPrice.toFixed(8),
                rsi: rsiValues[rsiValues.length - 1],
                rsi4h: rsiValues[rsiValues.length - 1],
                ema12: ema12Values[ema12Values.length - 1],
                ema26: ema26Values[ema26Values.length - 1],
                aboveMA14: currentPrice > ma14Values[ma14Values.length - 1],
                volume: ticker.volume,
                high24h: ticker.highPrice,
                low24h: ticker.lowPrice
              } as CryptoData;
            } catch (error) {
              console.error(`Error processing ${symbol}:`, error);
              return null;
            }
          })
      );

      const validPairs = usdtPairs.filter((pair): pair is CryptoData => 
        pair !== null && 
        !isNaN(pair.rsi4h || 0) && 
        !isNaN(parseFloat(pair.price || '0'))
      );

      console.log(`Found ${validPairs.length} valid pairs out of ${usdtPairs.length} total`);
      return validPairs;
    },
    refetchInterval: 15000,
    retry: 3,
    staleTime: 10000
  });
};