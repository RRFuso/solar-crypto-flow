import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MLPrediction {
  id: string;
  symbol: string;
  timeframe: string;
  prediction_type: 'price' | 'volatility' | 'breakout' | 'reversal';
  predicted_value: number;
  confidence: number;
  prediction_horizon: string;
  features: Record<string, number>;
  model_version: string;
  risk_score: number;
  supporting_factors: string[];
  predicted_at: string;
  valid_until: string;
}

export const useMLPredictions = (symbol: string, timeframe: string = '4h', predictionHorizon: string = '24h') => {
  return useQuery({
    queryKey: ['ml-prediction', symbol, timeframe, predictionHorizon],
    queryFn: async () => {
      // First, try to get cached prediction
      const { data: cachedPrediction } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('symbol', symbol)
        .eq('prediction_horizon', predictionHorizon)
        .gte('predicted_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('predicted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedPrediction) {
        console.log(`Using cached prediction for ${symbol}`);
        return cachedPrediction as MLPrediction;
      }

      // Generate new prediction
      const { data, error } = await supabase.functions.invoke('ml-predictions', {
        body: { symbol, timeframe, predictionHorizon }
      });

      if (error) {
        console.error('Error fetching prediction:', error);
        throw error;
      }

      return data as MLPrediction;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!symbol,
  });
};

export const useBatchMLPredictions = (symbols: string[], timeframe: string = '4h') => {
  return useQuery({
    queryKey: ['ml-predictions-batch', symbols, timeframe],
    queryFn: async () => {
      if (symbols.length === 0) return [];

      // Fetch valid predictions from database
      const { data: validPredictions } = await supabase
        .from('ai_predictions')
        .select('*')
        .in('symbol', symbols)
        .gte('valid_until', new Date().toISOString())
        .order('predicted_at', { ascending: false });

      return validPredictions as MLPrediction[] || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: symbols.length > 0,
  });
};