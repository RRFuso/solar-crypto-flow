
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateVolatilityCompression, detectVolumeSpike } from '@/lib/featureExtractor';
import { generateSignal, ExplosiveSignal } from '@/lib/predictionEngine';
import { HistoricalDataPoint } from '@/types/crypto';

// Função para buscar dados históricos de um único ativo
const fetchHistoricalData = async (symbol: string, days: number = 45): Promise<HistoricalDataPoint[]> => {
  const { data, error } = await supabase
    .from('crypto_historical_data')
    .select('date, close, volume, high, low')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(days);

  if (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
  return (data || []).reverse(); // Reverse to have oldest data first
};

// Hook principal para gerar os sinais
export const useExplosiveSignals = (symbols: string[]) => {
  return useQuery<Map<string, ExplosiveSignal>>({
    queryKey: ['explosiveSignals', symbols],
    queryFn: async () => {
      const signals = new Map<string, ExplosiveSignal>();

      const promises = symbols.map(async (symbol) => {
        try {
          const historicalData = await fetchHistoricalData(symbol);
          if (historicalData.length < 30) return; // Need enough data

          const volatilityCompression = calculateVolatilityCompression(historicalData);
          const volumeSpike = detectVolumeSpike(historicalData);

          const signal = generateSignal({
            symbol,
            volatilityCompression,
            volumeSpike,
          });

          if (signal) {
            signals.set(symbol, signal);
          }
        } catch (e) {
          console.error(`Failed to process signal for ${symbol}`, e);
        }
      });

      await Promise.all(promises);
      
      return signals;
    },
    enabled: symbols && symbols.length > 0,
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: false,
  });
};
