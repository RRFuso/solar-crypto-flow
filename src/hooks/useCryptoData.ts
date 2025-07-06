
import { useQuery } from '@tanstack/react-query';
import { fetchTickers, fetchKlines } from '@/lib/binance';
import { calculateRSI, calculateEMA } from '@/lib/technicalAnalysis';
import { CryptoData } from '@/types/crypto';
import { PREDEFINED_LISTS } from '@/lib/marketData/predefinedLists';

interface CryptoDataOptions {
  timeframe?: string;
  rsiOverbought?: number;
  rsiOversold?: number;
  filter?: string;
}

export const useCryptoData = (options: CryptoDataOptions = {}) => {
  const {
    timeframe = '4h',
    rsiOverbought = 70,
    rsiOversold = 30,
    filter = 'outperforming',
  } = options;

  return useQuery({
    queryKey: ['cryptos', timeframe, rsiOverbought, rsiOversold, filter],
    queryFn: async () => {
      console.log(`Fetching crypto data for filter: ${filter}...`);
      
      const allTickers = Object.values(PREDEFINED_LISTS).flat();
      const tickerList = [...new Set(allTickers)];
      if (tickerList.length === 0) {
        return [];
      }

      const tickers = await fetchTickers();
      const btcTicker = tickers['BTCUSDT'];
      
      if (!btcTicker) {
        console.error('BTC ticker not found');
        return [];
      }
      const btcChange = parseFloat(btcTicker.priceChangePercent);

      const batchSize = 20; // Reduced batch size
      let allPairs: (CryptoData | null)[] = [];

      for (let i = 0; i < tickerList.length; i += batchSize) {
        const batch = tickerList.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(tickerList.length / batchSize)}...`);
        
        const usdtPairs = await Promise.all(
          batch.map(async (symbol) => {
              const usdtSymbol = `${symbol}USDT`;
              try {
                const ticker = tickers[usdtSymbol];
                if (!ticker) return null;

                const klines = await fetchKlines(usdtSymbol, timeframe);
                if (!klines || klines.length === 0) return null;

                const prices = klines.map(k => parseFloat(k.close));
                const rsiValues = calculateRSI(prices);
                const ema12Values = calculateEMA(prices, 12);
                const ema26Values = calculateEMA(prices, 26);
                const ma14Values = calculateEMA(prices, 14);
                
                const currentPrice = parseFloat(ticker.lastPrice);
                const priceChange = parseFloat(ticker.priceChangePercent);
                
                if (isNaN(currentPrice) || isNaN(priceChange)) return null;

                return {
                  id: symbol,
                  name: symbol,
                  symbol: symbol,
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
                // Don't log error if it's a 404 for a symbol that doesn't exist
                if (error instanceof Error && error.message.includes('404')) {
                    // console.log(`Symbol ${usdtSymbol} not found, skipping.`);
                } else {
                    console.error(`Error processing ${usdtSymbol}:`, error);
                }
                return null;
              }
            })
        );
        allPairs = allPairs.concat(usdtPairs);
        
        // Add a delay between batches to avoid overwhelming the server
        if (i + batchSize < tickerList.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
        }
      }

      const validPairs = allPairs.filter((pair): pair is CryptoData => 
        pair !== null && 
        !isNaN(pair.rsi4h || 0) && 
        !isNaN(parseFloat(pair.price || '0'))
      );

      console.log(`Found ${validPairs.length} valid pairs for filter ${filter}`);
      return validPairs;
    },
    retry: 3,
    staleTime: 10000
  });
};
