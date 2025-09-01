import { useQuery } from '@tanstack/react-query';
import { getMarkets } from '@/services/coingecko';

type MarketRegime = 'Risk-On' | 'Risk-Off' | 'Neutral';

export const useMarketRegime = () => {
  return useQuery({
    queryKey: ['marketRegime', 'bitcoin'],
    queryFn: async () => {
      const btcData = await getMarkets({
        ids: 'bitcoin',
        vs_currency: 'usd',
        price_change_percentage: '24h'
      });

      if (!btcData || btcData.length === 0) {
        throw new Error('Could not fetch Bitcoin data');
      }

      const btc = btcData[0];
      const change24h = btc.price_change_percentage_24h;

      let regime: MarketRegime = 'Neutral';
      if (change24h > 2) {
        regime = 'Risk-On';
      } else if (change24h < -2) {
        regime = 'Risk-Off';
      }

      return {
        regime,
        btcPrice: btc.current_price,
        btcChange24h: change24h,
      };
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });
};
