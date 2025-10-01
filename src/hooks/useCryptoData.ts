
import { useQuery } from '@tanstack/react-query';
import { fetchCryptoData } from '@/lib/dataFetcher';
import { CryptoData } from '@/types/crypto';
import React from 'react';
import { getCategoriesForSymbol } from '@/lib/marketData/categoryMapping';

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

  const queryResult = useQuery({
    queryKey: ['cryptos', filter, dataSource],
    queryFn: async () => {
      console.log(`Fetching crypto data from ${dataSource} for filter: ${filter}...`);
      const allCryptos: CryptoData[] = await fetchCryptoData(dataSource);
      console.log('Fetched cryptos count:', allCryptos.length);
      // Filtering logic can remain here if needed, or be removed if we always fetch all and filter later
      return allCryptos;
    },
    retry: 3,
    staleTime: 600000 // Increased staleTime to 10 minutes
  });

  const cryptoDataMaps = React.useMemo(() => {
    const maps = {
      bySymbol: new Map<string, CryptoData>(),
      byId: new Map<string, CryptoData>(),
    };
    if (queryResult.data) {
      queryResult.data.forEach(crypto => {
        const categories = getCategoriesForSymbol(crypto.symbol);
        const cryptoWithCategory = {
          ...crypto,
          category: categories.length > 0 ? categories[0] : undefined,
        };

        if (cryptoWithCategory.symbol) {
          maps.bySymbol.set(cryptoWithCategory.symbol.toUpperCase(), cryptoWithCategory);
        }
        maps.byId.set(cryptoWithCategory.id, cryptoWithCategory);
      });
    }
    return maps;
  }, [queryResult.data]);

  return {
    ...queryResult,
    cryptoDataMaps, // Return the maps
    isLoading: queryResult.isLoading,
  };
};
