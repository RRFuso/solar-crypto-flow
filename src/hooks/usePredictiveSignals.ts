import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedCryptoData } from './useEnhancedCryptoData';
import { explosiveSignalProcessor } from '@/lib/signals/explosiveSignalProcessor';
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
          query = query.in('symbol', symbols);
        }

        const { data, error } = await query;
        if (error) throw error;

        const onChainMap = new Map<string, OnChainData>();
        data?.forEach(item => {
          onChainMap.set(item.symbol, {
            symbol: item.symbol,
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

  // Processar e agregar sinais
  const processedSignals = useMemo(() => {
    if (!cryptoData || !dbSignals || cryptoLoading || signalsLoading) {
      return new Map<string, PredictiveSignalAggregated>();
    }

    const aggregatedSignals = new Map<string, PredictiveSignalAggregated>();
    const cryptoMap = new Map(cryptoData.map(crypto => [crypto.symbol, crypto]));

    // Agrupar sinais por símbolo
    const signalsBySymbol = new Map<string, any[]>();
    dbSignals.forEach(signal => {
      if (!signalsBySymbol.has(signal.symbol)) {
        signalsBySymbol.set(signal.symbol, []);
      }
      signalsBySymbol.get(signal.symbol)!.push(signal);
    });

    // Processar sinais para cada símbolo
    signalsBySymbol.forEach((symbolSignals, symbol) => {
      const crypto = cryptoMap.get(symbol);
      if (!crypto) return;

      const onChain = onChainData?.get(symbol);
      
      // Separar sinais por tipo
      const explosiveSignals: ExplosiveSignal[] = [];
      const edgeSignals: EdgeSignal[] = [];
      const bottomSignals: BottomSignal[] = [];

      symbolSignals.forEach(signal => {
        const baseSignal = {
          symbol: signal.symbol,
          confidence: Number(signal.confidence),
          factors: signal.factors || [],
          timestamp: signal.updated_at
        };

        switch (signal.signal_type) {
          case 'explosive_upside':
            explosiveSignals.push({
              ...baseSignal,
              signalType: 'explosive_upside',
              riskLevel: signal.risk_level as 'low' | 'medium' | 'high',
              targetGain: Number(signal.target_gain),
              timeframe: signal.timeframe
            });
            break;
          
          case 'accumulation_edge':
          case 'distribution_edge':
            edgeSignals.push({
              ...baseSignal,
              signalType: signal.signal_type as 'accumulation_edge' | 'distribution_edge',
              strength: Number(signal.strength),
              phase: signal.phase as 'early' | 'middle' | 'late',
              volumeAnomaly: signal.volume_anomaly,
              smartMoneyFlow: signal.smart_money_flow as 'in' | 'out' | 'neutral'
            });
            break;
          
          case 'reversal_bottom':
          case 'capitulation_bottom':
            bottomSignals.push({
              ...baseSignal,
              signalType: signal.signal_type as 'reversal_bottom' | 'capitulation_bottom',
              supportLevel: Number(signal.support_level),
              volumeProfile: signal.volume_profile as 'decreasing' | 'spike' | 'normal',
              rsiDivergence: signal.rsi_divergence
            });
            break;
        }
      });

      // Gerar sinais adicionais em tempo real usando o processador
      const realtimeExplosive = explosiveSignalProcessor.processExplosiveSignals(crypto, onChain);
      const realtimeEdge = explosiveSignalProcessor.processEdgeSignals(crypto, onChain);
      const realtimeBottom = explosiveSignalProcessor.processBottomSignals(crypto, onChain);

      if (realtimeExplosive && realtimeExplosive.confidence >= minConfidence) {
        explosiveSignals.push(realtimeExplosive);
      }
      if (realtimeEdge) {
        edgeSignals.push(realtimeEdge);
      }
      if (realtimeBottom && realtimeBottom.confidence >= minConfidence) {
        bottomSignals.push(realtimeBottom);
      }

      // Calcular score geral
      const allSignals = [...explosiveSignals, ...edgeSignals, ...bottomSignals];
      const totalConfidence = allSignals.reduce((sum, signal) => {
        const signalStrength = 'confidence' in signal ? signal.confidence : 
                              'strength' in signal ? signal.strength : 0;
        return sum + signalStrength;
      }, 0);
      const overallScore = Math.min(100, allSignals.length > 0 ? (totalConfidence / allSignals.length) * 100 : 0);

      // Determinar ação recomendada
      let recommendedAction: 'buy' | 'sell' | 'hold' | 'watch' = 'watch';
      let riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' = 'medium';

      if (explosiveSignals.length > 0 && explosiveSignals[0].confidence > 0.8) {
        recommendedAction = 'buy';
        riskLevel = explosiveSignals[0].riskLevel === 'low' ? 'low' : 'medium';
      } else if (edgeSignals.some(s => s.signalType === 'distribution_edge')) {
        recommendedAction = 'sell';
        riskLevel = 'medium';
      } else if (bottomSignals.length > 0) {
        recommendedAction = 'buy';
        riskLevel = 'low';
      } else if (overallScore > 70) {
        recommendedAction = 'hold';
      }

      aggregatedSignals.set(symbol, {
        symbol,
        explosiveSignals,
        edgeSignals,
        bottomSignals,
        onChainData: onChain || null,
        overallScore,
        recommendedAction,
        riskLevel,
        timestamp: new Date().toISOString()
      });
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