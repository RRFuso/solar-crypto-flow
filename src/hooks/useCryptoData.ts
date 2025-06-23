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
      try {
        console.log('Fetching crypto data...');
        const tickers = await fetchTickers();
        
        if (!tickers || Object.keys(tickers).length === 0) {
          console.warn('No tickers data received');
          return [];
        }

        const btcTicker = tickers['BTCUSDT'];
        
        if (!btcTicker) {
          console.error('BTC ticker not found');
          return [];
        }

        const btcChange = parseFloat(btcTicker.priceChangePercent || '0');

        const usdtPairs = await Promise.all(
          Object.entries(tickers)
            .filter(([symbol]) => symbol.endsWith('USDT'))
            .slice(0, 50) // Limit to first 50 pairs to avoid overwhelming the API
            .map(async ([symbol, ticker]) => {
              try {
                console.log(`Processing ${symbol}...`);
                const klines = await fetchKlines(symbol, timeframe);
                
                if (!klines || klines.length === 0) {
                  console.log(`No klines data for ${symbol}`);
                  return null;
                }

                const prices = klines.map(k => parseFloat(k.close || '0')).filter(p => !isNaN(p));
                
                if (prices.length === 0) {
                  console.log(`No valid prices for ${symbol}`);
                  return null;
                }
                
                const rsiValues = calculateRSI(prices);
                const ema12Values = calculateEMA(prices, 12);
                const ema26Values = calculateEMA(prices, 26);
                const ma14Values = calculateEMA(prices, 14);
                
                const currentPrice = parseFloat(ticker.lastPrice || '0');
                const priceChange = parseFloat(ticker.priceChangePercent || '0');
                
                if (isNaN(currentPrice) || isNaN(priceChange)) {
                  console.log(`Invalid price data for ${symbol}`);
                  return null;
                }

                // Extract the symbol without USDT suffix
                const baseSymbol = symbol.replace('USDT', '');

                return {
                  id: baseSymbol,
                  name: baseSymbol,
                  symbol: baseSymbol,
                  performance: priceChange - btcChange,
                  price: currentPrice.toFixed(8),
                  rsi: rsiValues[rsiValues.length - 1] || 50,
                  rsi4h: rsiValues[rsiValues.length - 1] || 50,
                  ema12: ema12Values[ema12Values.length - 1] || currentPrice,
                  ema26: ema26Values[ema26Values.length - 1] || currentPrice,
                  aboveMA14: currentPrice > (ma14Values[ma14Values.length - 1] || currentPrice),
                  volume: ticker.volume || '0',
                  high24h: ticker.highPrice || ticker.lastPrice || '0',
                  low24h: ticker.lowPrice || ticker.lastPrice || '0'
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
      } catch (error) {
        console.error('Error in crypto data query:', error);
        // Return empty array instead of throwing to prevent complete failure
        return [];
      }
    },
    refetchInterval: 30000, // Increased interval to reduce API pressure
    retry: 2, // Reduced retries
    staleTime: 20000, // Increased stale time
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnMount: true
  });
};