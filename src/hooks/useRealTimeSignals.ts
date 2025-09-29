import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealTimeSignal {
  symbol: string;
  explosive_potential: string;
  volume_anomaly?: boolean;
  price_momentum?: boolean;
  social_buzz?: boolean;
  whale_activity: number;
  technical_breakout?: boolean;
  confidence_score?: number;
  timestamp?: string;
  factors?: string[];
  is_accumulation?: boolean;
  is_distribution?: boolean;
  is_accelerating?: boolean;
  is_expansion?: boolean;
  is_breakout?: boolean;
  smart_money_sentiment?: string;
  accumulation_strength?: number;
  distribution_strength?: number;
  last_updated: string;
}

export const useRealTimeSignals = () => {
  const [signals, setSignals] = useState<RealTimeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Fetch latest signals (otimizado)
  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_price_action_signals')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSignals(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching real-time signals:', error);
      toast({
        title: "Erro ao carregar sinais",
        description: "Não foi possível carregar os sinais em tempo real",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger data collection
  const triggerDataCollection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('crypto-data-collector');
      
      if (error) throw error;

      toast({
        title: "Coleta de dados iniciada",
        description: "Os dados estão sendo coletados das APIs em tempo real"
      });

      // Refresh signals after collection
      setTimeout(fetchSignals, 5000);
    } catch (error) {
      console.error('Error triggering data collection:', error);
      toast({
        title: "Erro na coleta de dados",
        description: "Não foi possível iniciar a coleta de dados",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSignals();

    // Set up real-time subscription (otimizado)
    const channel = supabase
      .channel('crypto_signals', {
        config: {
          broadcast: { self: false },
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_price_action_signals'
        },
        () => {
          // Remover logs para reduzir overhead
          fetchSignals(); // Refresh on any change
        }
      )
      .subscribe();

    // Auto-refresh aumentado para 15 minutos (reduz Egress)
    const interval = setInterval(fetchSignals, 15 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    signals,
    loading,
    lastUpdate,
    fetchSignals,
    triggerDataCollection
  };
};