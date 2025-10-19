import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SentimentData {
  id: string;
  symbol: string;
  source: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  volume: number;
  confidence: number;
  key_topics: string[];
  analyzed_at: string;
}

export const useSentimentData = (symbols: string[]) => {
  return useQuery({
    queryKey: ['sentiment-data', symbols],
    queryFn: async () => {
      if (symbols.length === 0) return [];

      // First, try to get cached sentiment data
      const { data: cachedData } = await supabase
        .from('sentiment_data')
        .select('*')
        .in('symbol', symbols)
        .gte('analyzed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('analyzed_at', { ascending: false });

      const cachedSymbols = new Set(cachedData?.map(d => d.symbol) || []);
      const missingSymbols = symbols.filter(s => !cachedSymbols.has(s));

      // Fetch sentiment for missing symbols
      if (missingSymbols.length > 0) {
        const { data: fetchedData, error } = await supabase.functions.invoke('sentiment-analysis', {
          body: { symbols: missingSymbols }
        });

        if (error) {
          console.error('Error fetching sentiment:', error);
        }

        // Refetch from database to get newly inserted data
        const { data: newData } = await supabase
          .from('sentiment_data')
          .select('*')
          .in('symbol', missingSymbols)
          .order('analyzed_at', { ascending: false });

        return [...(cachedData || []), ...(newData || [])];
      }

      return cachedData || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: symbols.length > 0,
  });
};

export const useSentimentMap = (symbols: string[]) => {
  const { data, ...rest } = useSentimentData(symbols);
  
  const sentimentMap = new Map<string, SentimentData>();
  data?.forEach(item => {
    // Keep most recent sentiment for each symbol
    if (!sentimentMap.has(item.symbol)) {
      sentimentMap.set(item.symbol, {
        ...item,
        sentiment_label: item.sentiment_label as 'positive' | 'neutral' | 'negative'
      });
    }
  });

  return {
    sentimentMap,
    ...rest
  };
};
