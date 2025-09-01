import { useQuery } from '@tanstack/react-query';
import mockNarratives from '@/lib/data/mockNarratives.json';

export interface Narrative {
  name: string;
  status: 'Hot' | 'Trending' | 'Neutral' | 'Cooling';
  description: string;
  tokens: string[];
  momentum: number;
}

export const useNarrativeData = () => {
  return useQuery({
    queryKey: ['narrativeData'],
    queryFn: async (): Promise<Narrative[]> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real scenario, this would be an API call.
      // Here, we're just returning the imported mock data.
      return mockNarratives as Narrative[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
