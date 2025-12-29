import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ========== TYPES ==========
export interface SmartMoneyFlow {
  token_symbol: string;
  timeframe: string;
  net_flow_usd: number;
  total_inflow_usd: number;
  total_outflow_usd: number;
  whale_tx_count: number;
  dominant_direction: 'bullish' | 'bearish' | 'neutral';
  flow_intensity: number;
  ema_flow: number;
  last_updated: string;
}

export interface FlowDirection {
  symbol: string;
  direction: 1 | -1 | 0; // 1 = bullish (saindo de exchanges), -1 = bearish (entrando), 0 = neutral
  intensity: number; // 0-100
  color: string; // Cor da partícula baseada na direção
  speed: number; // Velocidade da partícula baseada na intensidade
}

// ========== CONSTANTES ==========
const FLOW_COLORS = {
  bullish: '#22c55e', // green-500
  bearish: '#ef4444', // red-500
  neutral: '#facc15', // yellow-400
};

const BASE_PARTICLE_SPEED = 0.002;

// ========== HOOK PRINCIPAL ==========
export function useSmartMoneyFlows(symbols: string[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']) {
  const queryClient = useQueryClient();
  const [flowDirections, setFlowDirections] = useState<Map<string, FlowDirection>>(new Map());
  const lastUpdateRef = useRef<number>(0);

  // Query para buscar fluxos do cache
  const { data: flows, isLoading, error, refetch } = useQuery({
    queryKey: ['smart-money-flows', symbols.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-money-tracker', {
        body: {
          action: 'get_flows',
          symbols,
          timeframe: '1h',
        },
      });

      if (error) throw error;
      return (data?.data || []) as SmartMoneyFlow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
    refetchOnWindowFocus: false,
  });

  // Processar fluxos em direções para partículas
  useEffect(() => {
    if (!flows || flows.length === 0) return;

    const newDirections = new Map<string, FlowDirection>();

    flows.forEach((flow) => {
      // Determinar direção baseado no net flow
      let direction: 1 | -1 | 0 = 0;
      let color = FLOW_COLORS.neutral;

      if (flow.dominant_direction === 'bullish') {
        direction = 1;
        color = FLOW_COLORS.bullish;
      } else if (flow.dominant_direction === 'bearish') {
        direction = -1;
        color = FLOW_COLORS.bearish;
      }

      // Calcular velocidade baseada na intensidade
      // Intensidade de 0-100 mapeia para velocidade de 0.001 a 0.005
      const speedMultiplier = 1 + (flow.flow_intensity / 100) * 2;
      const speed = BASE_PARTICLE_SPEED * speedMultiplier;

      newDirections.set(flow.token_symbol, {
        symbol: flow.token_symbol,
        direction,
        intensity: flow.flow_intensity,
        color,
        speed,
      });
    });

    setFlowDirections(newDirections);
    lastUpdateRef.current = Date.now();
  }, [flows]);

  // Função para obter direção de fluxo para um símbolo específico
  const getFlowDirection = useCallback((symbol: string): FlowDirection => {
    const upperSymbol = symbol.toUpperCase();
    return flowDirections.get(upperSymbol) || {
      symbol: upperSymbol,
      direction: 0,
      intensity: 0,
      color: FLOW_COLORS.neutral,
      speed: BASE_PARTICLE_SPEED,
    };
  }, [flowDirections]);

  // Função para forçar atualização dos fluxos
  const updateFlows = useCallback(async () => {
    try {
      await supabase.functions.invoke('smart-money-tracker', {
        body: {
          action: 'update_flows',
          timeframe: '1h',
        },
      });
      
      // Refetch após atualização
      await refetch();
    } catch (error) {
      console.error('Error updating smart money flows:', error);
    }
  }, [refetch]);

  // Verificar se os dados estão frescos
  const isDataFresh = useCallback(() => {
    if (!flows || flows.length === 0) return false;
    const oldestUpdate = flows.reduce((oldest, flow) => {
      const updateTime = new Date(flow.last_updated).getTime();
      return updateTime < oldest ? updateTime : oldest;
    }, Date.now());
    
    // Considerar fresco se atualizado nos últimos 15 minutos
    return Date.now() - oldestUpdate < 15 * 60 * 1000;
  }, [flows]);

  return {
    flows,
    flowDirections,
    getFlowDirection,
    isLoading,
    error,
    updateFlows,
    isDataFresh,
    refetch,
  };
}

// ========== HOOK PARA VISUALIZAÇÃO DE PARTÍCULAS ==========
export function useParticleFlowConfig(flows: SmartMoneyFlow[] | undefined) {
  return useCallback((linkData: { source: { symbol?: string }; target: { symbol?: string }; percentage: number }) => {
    if (!flows || flows.length === 0) {
      // Fallback para comportamento original
      return {
        direction: linkData.percentage > 0 ? 1 : -1,
        color: FLOW_COLORS.neutral,
        speed: BASE_PARTICLE_SPEED,
      };
    }

    // Tentar encontrar fluxo para source ou target
    const sourceSymbol = linkData.source.symbol?.toUpperCase();
    const targetSymbol = linkData.target.symbol?.toUpperCase();
    
    const sourceFlow = flows.find(f => f.token_symbol === sourceSymbol);
    const targetFlow = flows.find(f => f.token_symbol === targetSymbol);
    
    // Priorizar o fluxo do símbolo com maior intensidade
    const primaryFlow = 
      (sourceFlow?.flow_intensity || 0) > (targetFlow?.flow_intensity || 0) 
        ? sourceFlow 
        : targetFlow;

    if (!primaryFlow) {
      return {
        direction: linkData.percentage > 0 ? 1 : -1,
        color: FLOW_COLORS.neutral,
        speed: BASE_PARTICLE_SPEED,
      };
    }

    // Determinar direção real baseada no fluxo on-chain
    let direction = 0;
    let color = FLOW_COLORS.neutral;

    if (primaryFlow.dominant_direction === 'bullish') {
      direction = 1;
      color = FLOW_COLORS.bullish;
    } else if (primaryFlow.dominant_direction === 'bearish') {
      direction = -1;
      color = FLOW_COLORS.bearish;
    }

    // Velocidade proporcional à intensidade
    const speedMultiplier = 1 + (primaryFlow.flow_intensity / 100) * 2;

    return {
      direction: direction || (linkData.percentage > 0 ? 1 : -1),
      color,
      speed: BASE_PARTICLE_SPEED * speedMultiplier,
      intensity: primaryFlow.flow_intensity,
      isRealData: true,
    };
  }, [flows]);
}
