import { useQuery } from '@tanstack/react-query';

interface SocialHypeData {
  symbol: string;
  name: string;
  mentions24h: number;
  trend: 'up' | 'down';
  sentiment: 'positive' | 'neutral' | 'negative';
  mentionsHistory: number[];
}

// Temporary mock data until API integration
const mockData: SocialHypeData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    mentions24h: 15234,
    trend: 'up',
    sentiment: 'positive',
    mentionsHistory: [10, 12, 15, 14, 16, 15, 15],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    mentions24h: 8765,
    trend: 'down',
    sentiment: 'neutral',
    mentionsHistory: [9, 8, 7, 6, 5, 6, 5],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    mentions24h: 5432,
    trend: 'up',
    sentiment: 'positive',
    mentionsHistory: [4, 5, 6, 7, 8, 7, 8],
  },
];

export const useSocialHypeData = () => {
  return useQuery({
    queryKey: ['socialHype'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockData;
    },
  });
};