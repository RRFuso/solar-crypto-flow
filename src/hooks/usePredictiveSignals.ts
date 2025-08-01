import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedCryptoData } from './useEnhancedCryptoData';
import { RealTimeSignalProcessor } from '@/lib/signals/realTimeSignalProcessor';
import { 
  PredictiveSignalAggregated, 
  ExplosiveSignal, 
  EdgeSignal, 
  BottomSignal,
  OnChainData,
  SIGNAL_COLORS 
} from '@/types/predictiveSignals';
import { CryptoData } from '@/types/crypto';
import { toast } from 'sonner';

interface PredictiveSignalsOptions {
  symbols?: string[];
  enableAlerts?: boolean;
  minConfidence?: number;
}

interface PredictiveSignalsReturn {
  signals: Map<string, PredictiveSignalAggregated>;
  loading: boolean;
  error: string | null;
  refreshSignals: () => void;
  getSignalColor: (signalType: string) => typeof SIGNAL_COLORS[keyof typeof SIGNAL_COLORS];
}

export const usePredictiveSignals = (
  options: PredictiveSignalsOptions = {}
): PredictiveSignalsReturn => {
  const { 
    symbols = [], 
    enableAlerts = true, 
    minConfidence = 0.6 
  } = options;

  const [signals, setSignals] = useState<Map<string, PredictiveSignalAggregated>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { data: cryptoData, isLoading: cryptoLoading } = useEnhancedCryptoData();

  // Buscar sinais preditivos do Supabase
  const { data: dbSignals, isLoading: signalsLoading, refetch } = useQuery({
    queryKey: ['predictive-signals', symbols],
    queryFn: async () => {
      try {
        let query = supabase
          .from('predictive_signals')
          .select('*')
          .order('updated_at', { ascending: false });

        if (symbols.length > 0) {
          query = query.in('symbol', symbols);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar sinais preditivos:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // 30 segundos
  });

  // Buscar dados on-chain históricos do Supabase
  const { data: onChainData } = useQuery({
    queryKey: ['onchain-data', symbols],
    queryFn: async () => {
      try {
        let query = supabase
          .from('crypto_price_action_signals')
          .select('symbol, whale_activity, smart_money_sentiment, is_accumulation, is_distribution, accumulation_strength, distribution_strength');

        if (symbols.length > 0) {
          // Mapear símbolos para formato USDT (ex: BTC -> BTCUSDT)
          const usdtSymbols = symbols.map(s => `${s}USDT`);
          query = query.in('symbol', usdtSymbols);
        }

        const { data, error } = await query;
        if (error) throw error;

        const onChainMap = new Map<string, OnChainData>();
        data?.forEach(item => {
          // Mapear de volta para símbolo base (ex: BTCUSDT -> BTC)
          const baseSymbol = item.symbol.replace('USDT', '');
          onChainMap.set(baseSymbol, {
            symbol: baseSymbol,
            whaleActivity: item.whale_activity || 0,
            exchangeNetFlow: 0, // Não temos esse dado no schema atual
            accumulationScore: item.accumulation_strength || 0,
            distributionScore: item.distribution_strength || 0,
            smartMoneySentiment: (item.smart_money_sentiment as 'bullish' | 'bearish' | 'neutral') || 'neutral',
            lastUpdated: new Date().toISOString()
          });
        });

        return onChainMap;
      } catch (err) {
        console.error('Erro ao buscar dados on-chain:', err);
        return new Map<string, OnChainData>();
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Processar e agregar sinais em tempo real baseados nos dados do mercado
  const processedSignals = useMemo(() => {
    if (!cryptoData || cryptoLoading) {
      return new Map<string, PredictiveSignalAggregated>();
    }

    const aggregatedSignals = new Map<string, PredictiveSignalAggregated>();
    
    // Filtrar cryptos que têm dados suficientes para análise
    const validCryptos = cryptoData.filter(crypto => {
      return crypto.price && 
             crypto.change24h !== undefined &&
             crypto.volume24h &&
             (symbols.length === 0 || symbols.includes(crypto.symbol || ''));
    });

    // Processar sinais para cada crypto válida
    validCryptos.forEach(crypto => {
      try {
        const processedSignal = RealTimeSignalProcessor.processAllSignals(crypto);
        
        // Só incluir se houver sinais significativos
        if (processedSignal.overallScore > 0 || 
            processedSignal.explosiveSignals.length > 0 ||
            processedSignal.edgeSignals.length > 0 ||
            processedSignal.bottomSignals.length > 0) {
          aggregatedSignals.set(crypto.symbol || '', processedSignal);
        }
      } catch (error) {
        console.warn(`Erro ao processar sinais para ${crypto.symbol}:`, error);
      }
    });

    return aggregatedSignals;
  }, [cryptoData, dbSignals, onChainData, minConfidence, cryptoLoading, signalsLoading]);

  // Alertas para sinais de alta confiança
  useEffect(() => {
    if (!enableAlerts) return;

    processedSignals.forEach((signal) => {
      const highConfidenceSignals = [
        ...signal.explosiveSignals.filter(s => s.confidence > 0.8),
        ...signal.bottomSignals.filter(s => s.confidence > 0.8)
      ];

      highConfidenceSignals.forEach((highSignal) => {
        const title = highSignal.signalType === 'explosive_upside' 
          ? `🚀 Sinal Explosivo: ${signal.symbol}`
          : `📊 Fundo Detectado: ${signal.symbol}`;
        
        const factors = 'factors' in highSignal ? highSignal.factors : [];
        const description = `Confiança: ${(highSignal.confidence * 100).toFixed(0)}% - ${factors.join(', ')}`;
        
        toast(title, {
          description,
          duration: 5000,
        });
      });
    });
  }, [processedSignals, enableAlerts]);

  const refreshSignals = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['onchain-data'] });
  };

  const getSignalColor = (signalType: string) => {
    return SIGNAL_COLORS[signalType] || SIGNAL_COLORS.explosive_upside;
  };

  return {
    signals: processedSignals,
    loading: cryptoLoading || signalsLoading,
    error,
    refreshSignals,
    getSignalColor
  };
};