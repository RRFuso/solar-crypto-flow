
import { useQuery } from '@tanstack/react-query';
import { fetchTickers, fetchKlines } from '@/lib/binance';
import { calculateRSI, calculateEMA, calculateMACD } from '@/lib/technicalAnalysis';
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
      console.log('PREDEFINED_LISTS allTickers count:', allTickers.length);

      const tickerList = [...new Set(allTickers)];
      console.log('Unique tickerList count:', tickerList.length);
      if (tickerList.length === 0) {
        console.warn('tickerList is empty. No cryptos to fetch.');
        return [];
      }

      const tickers = await fetchTickers();
      console.log('Fetched tickers count:', Object.keys(tickers).length);
      const btcTicker = tickers['BTCUSDT'];
      
      if (!btcTicker) {
        console.error('BTC ticker not found');
        return [];
      }
      const btcChange = parseFloat(btcTicker.priceChangePercent);

      const batchSize = 10; // Further reduced batch size
      let allPairs: (CryptoData | null)[] = [];

      for (let i = 0; i < tickerList.length; i += batchSize) {
        const batch = tickerList.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(tickerList.length / batchSize)}...`);
        
        const usdtPairs = await Promise.all(
          batch.map(async (symbol) => {
              const usdtSymbol = `${symbol}USDT`;
              try {
                const ticker = tickers[usdtSymbol];
                if (!ticker) {
                  // console.log(`Ticker for ${usdtSymbol} not found in fetched tickers.`);
                  return null;
                }

                const klines = await fetchKlines(usdtSymbol, timeframe);
                if (!klines || klines.length === 0) {
                  // console.log(`Klines for ${usdtSymbol} not found or empty.`);
                  return null;
                }

                const prices = klines.map(k => parseFloat(k.close));
                const rsiValues = calculateRSI(prices);
                const ema12Values = calculateEMA(prices, 12);
                const ema26Values = calculateEMA(prices, 26);
                const ma14Values = calculateEMA(prices, 14);
                const macdResult = calculateMACD(prices);
                
                const currentPrice = parseFloat(ticker.lastPrice);
                const priceChange = parseFloat(ticker.priceChangePercent);
                const priceChange1h = klines.length >= 2 ? ((parseFloat(klines[klines.length - 1].close) - parseFloat(klines[klines.length - 2].close)) / parseFloat(klines[klines.length - 2].close)) * 100 : 0;

                // Divergence detection logic
                let hasBullishDivergence = false;
                let hasBearishDivergence = false;

                const lookbackPeriod = 5; // Look back 5 candles for divergence
                if (klines.length >= lookbackPeriod) {
                  const recentKlines = klines.slice(-lookbackPeriod);
                  const recentPrices = recentKlines.map(k => parseFloat(k.close));
                  const recentRSI = calculateRSI(recentPrices);

                  // Simple bullish divergence: lower low in price, higher low in RSI
                  // Check for a lower low in price in the recent period
                  const currentLow = parseFloat(klines[klines.length - 1].low);
                  const previousLow = Math.min(...recentKlines.slice(0, lookbackPeriod - 1).map(k => parseFloat(k.low)));
                  
                  // Check for a higher low in RSI in the recent period
                  const currentRSI = rsiValues[rsiValues.length - 1];
                  const previousRSIForBullish = Math.min(...recentRSI.slice(0, recentRSI.length - 1));

                  if (currentLow < previousLow && currentRSI > previousRSIForBullish) {
                    hasBullishDivergence = true;
                  }

                  // Simple bearish divergence: higher high in price, lower high in RSI
                  // Check for a higher high in price in the recent period
                  const currentHigh = parseFloat(klines[klines.length - 1].high);
                  const previousHigh = Math.max(...recentKlines.slice(0, lookbackPeriod - 1).map(k => parseFloat(k.high)));

                  // Check for a lower high in RSI in the recent period
                  const previousRSIForBearish = Math.max(...recentRSI.slice(0, recentRSI.length - 1));

                  if (currentHigh > previousHigh && currentRSI < previousRSIForBearish) {
                    hasBearishDivergence = true;
                  }
                }
                
                if (isNaN(currentPrice) || isNaN(priceChange)) {
                  // console.log(`Invalid price or change for ${usdtSymbol}.`);
                  return null;
                }

                return {
                  id: symbol,
                  name: symbol,
                  symbol: symbol,
                  performance: priceChange - btcChange,
                  price: currentPrice,  // Already a number
                  change24h: parseFloat(ticker.priceChangePercent),
                  volume24h: parseFloat(ticker.volume),
                  marketCap: parseFloat(ticker.quoteVolume), // Using quoteVolume as an approximation for marketCap
                  rsi: rsiValues[rsiValues.length - 1],
                  rsi4h: rsiValues[rsiValues.length - 1],
                  ema12: ema12Values[ema12Values.length - 1],
                  ema26: ema26Values[ema26Values.length - 1],
                  aboveMA14: currentPrice > ma14Values[ma14Values.length - 1],
                  high24h: parseFloat(ticker.highPrice),
                  low24h: parseFloat(ticker.lowPrice),
                  macd: {
                    value: macdResult.macd[macdResult.macd.length - 1],
                    signal: macdResult.signal[macdResult.signal.length - 1],
                    histogram: macdResult.histogram[macdResult.histogram.length - 1],
                  },
                  priceChange1h: priceChange1h,
                  hasBullishDivergence,
                  hasBearishDivergence,
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
        console.log(`Batch ${i / batchSize + 1} processed. Current allPairs length: ${allPairs.length}`);
        
        // Add a delay between batches to avoid overwhelming the server
        if (i + batchSize < tickerList.length) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        }
      }

      console.log(`Total allPairs before validation: ${allPairs.length}`);
      const validPairs = allPairs.filter((pair): pair is CryptoData => 
        pair !== null && 
        !isNaN(pair.rsi4h || 0) && 
        !isNaN(pair.price || 0)
      );
      console.log(`Total validPairs after validation: ${validPairs.length}`);

      let filteredPairs = validPairs;

      switch (filter) {
        case 'outperforming':
          filteredPairs = validPairs.filter(pair => pair.performance > 0);
          break;
        case 'bullish':
          filteredPairs = validPairs.filter(pair => pair.change24h > 0);
          break;
        case 'bearish':
          filteredPairs = validPairs.filter(pair => pair.change24h < 0);
          break;
        case 'overbought':
          filteredPairs = validPairs.filter(pair => pair.rsi > rsiOverbought);
          break;
        case 'oversold':
          filteredPairs = validPairs.filter(pair => pair.rsi < rsiOversold);
          break;
        case 'div-bull':
          filteredPairs = validPairs.filter(pair => pair.hasBullishDivergence);
          break;
        case 'div-bear':
          filteredPairs = validPairs.filter(pair => pair.hasBearishDivergence);
          break;
        case 'explosive_potential':
          // Placeholder for explosive potential logic
          // This could involve volume spikes, specific chart patterns, etc.
          filteredPairs = validPairs.filter(pair => pair.volume24h > 100000000 && pair.change24h > 5); // Example: high volume and significant price increase
          break;
        default:
          // No filter or unknown filter, return all valid pairs
          break;
      }

      console.log(`Found ${filteredPairs.length} filtered pairs for filter ${filter}`);
      return filteredPairs;
    },
    retry: 3,
    staleTime: 600000 // Increased staleTime to 10 minutes
  });
};
