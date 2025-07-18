
import { useQuery } from '@tanstack/react-query';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { CryptoData } from '@/types/crypto';

interface CryptoDataOptions {
  timeframe?: string;
  rsiOverbought?: number;
  rsiOversold?: number;
  filter?: string;
  dataSource?: 'coingecko' | 'binance';
}

export const useCryptoData = (options: CryptoDataOptions = {}) => {
  const {
    filter = 'outperforming',
    dataSource = 'coingecko', // Default to CoinGecko
  } = options;

  return useQuery({
    queryKey: ['cryptos', filter, dataSource],
    queryFn: async () => {
      console.log(`Fetching crypto data from ${dataSource} for filter: ${filter}...`);

      const allCryptos: CryptoData[] = await fetchCryptoData(dataSource);

      console.log('Fetched cryptos count:', allCryptos.length);

      let filteredCryptos = allCryptos;

      switch (filter) {
        case 'outperforming':
          filteredCryptos = allCryptos.filter(crypto => (crypto.performance || 0) > 0);
          break;
        case 'bullish':
          filteredCryptos = allCryptos.filter(crypto => (crypto.priceChange24h || 0) > 0);
          break;
        case 'bearish':
          filteredCryptos = allCryptos.filter(crypto => (crypto.priceChange24h || 0) < 0);
          break;
        case 'overbought':
          // Note: RSI data might not be available directly from CoinGecko /markets endpoint
          // or from Binance 24hr ticker. This filter might need adjustment or
          // additional data fetching/calculation if precise RSI is required.
          filteredCryptos = allCryptos.filter(crypto => (crypto.rsi || 0) > 70);
          break;
        case 'oversold':
          filteredCryptos = allCryptos.filter(crypto => (crypto.rsi || 0) < 30);
          break;
        case 'div-bull':
          // Divergence data is not directly available from CoinGecko /markets endpoint
          // or from Binance 24hr ticker.
          filteredCryptos = allCryptos.filter(crypto => crypto.hasBullishDivergence);
          break;
        case 'div-bear':
          // Divergence data is not directly available from CoinGecko /markets endpoint
          filteredCryptos = allCryptos.filter(crypto => crypto.hasBearishDivergence);
          break;
        case 'explosive_potential':
          console.log("Applying explosive_potential filter...");
          filteredCryptos = allCryptos.filter(crypto => {
            const isExplosive = (crypto.volume || 0) > 100000000 && (crypto.priceChange24h || 0) > 5;
            if (!isExplosive) {
              console.log(`Skipping ${crypto.symbol}: volume=${crypto.volume}, priceChange24h=${crypto.priceChange24h}`);
            }
            return isExplosive;
          });
          break;
        default:
          // No filter or unknown filter, return all valid cryptos
          break;
      }

      console.log(`Found ${filteredCryptos.length} filtered cryptos for filter ${filter}`);
      return filteredCryptos;
    },
    retry: 3,
    staleTime: 600000 // Increased staleTime to 10 minutes
  });
};
