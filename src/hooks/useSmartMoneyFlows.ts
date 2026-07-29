import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ========== TYPES ==========
export interface ConfidenceFactors {
  transactionSize: number;
  gasPrice: number;
  toExchange: number;
  fromExchange: number;
  successfulTx: number;
  historicalPattern: number;
}

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
  // New confidence fields
  confidence_score?: number;
  confidence_factors?: ConfidenceFactors;
  whale_transactions_value?: number;
  avg_gas_price_gwei?: number;
  successful_tx_count?: number;
}

export interface FlowDirection {
  symbol: string;
  direction: 1 | -1 | 0;
  intensity: number;
  color: string;
  speed: number;
  // Enhanced with confidence data
  confidenceScore?: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  isSmartMoney: boolean;
  whaleTxCount?: number;
  factors?: ConfidenceFactors;
}

// ========== CONSTANTS ==========
const FLOW_COLORS = {
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#facc15',
  highConfidence: '#8b5cf6', // Purple for high confidence
};

const BASE_PARTICLE_SPEED = 0.002;
const HIGH_CONFIDENCE_THRESHOLD = 60;
const MEDIUM_CONFIDENCE_THRESHOLD = 40;

/**
 * A flow row is only a *live* smart-money signal while it is fresh.
 * Beyond this age the row is historical data and must NOT be presented as
 * a current signal (otherwise the same tokens stay "high confidence" forever).
 */
export const FLOW_MAX_AGE_MS = 20 * 60 * 1000; // 20 min

export function isFlowFresh(lastUpdated?: string | null): boolean {
  if (!lastUpdated) return false;
  const ts = new Date(lastUpdated).getTime();
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < FLOW_MAX_AGE_MS;
}

/**
 * Legacy rows were written by an additive scoring model that produced
 * unbounded values (e.g. 1150). Anything outside 0-100 is not a percentage.
 */
export function normalizeConfidence(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}


// ========== HOOK PRINCIPAL ==========
export function useSmartMoneyFlows(symbols: string[] = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']) {
  const queryClient = useQueryClient();
  const [flowDirections, setFlowDirections] = useState<Map<string, FlowDirection>>(new Map());
  const lastUpdateRef = useRef<number>(0);

  const { data: flows, isLoading, error, refetch } = useQuery({
    queryKey: ['smart-money-flows', symbols.join(',')],
    queryFn: async () => {
      // Try edge function first
      try {
        const { data, error } = await supabase.functions.invoke('smart-money-tracker', {
          body: {
            action: 'get_flows',
            symbols,
            timeframe: '1h',
          },
        });

        if (!error && data?.data?.length > 0) {
          // The edge function already filters by expires_at, but re-check age
          // client-side so a stalled tracker can never look "live".
          return (data.data as SmartMoneyFlow[])
            .filter(f => isFlowFresh(f.last_updated))
            .map(f => ({ ...f, confidence_score: normalizeConfidence(f.confidence_score) }));
        }
      } catch (e) {
        console.warn('smart-money-tracker edge function failed, falling back to DB:', e);
      }

      // Fallback: read directly from smart_money_flow_cache table
      console.log('[SmartMoneyFlows] Using DB fallback for symbols:', symbols);
      const upperSymbols = symbols.map(s => s.toUpperCase());
      const { data: cacheData, error: dbError } = await supabase
        .from('smart_money_flow_cache')
        .select('*')
        .in('token_symbol', upperSymbols)
        // Only rows the tracker still considers valid — never resurrect stale ones.
        .gt('expires_at', new Date().toISOString())
        .order('last_updated', { ascending: false });

      if (dbError || !cacheData) {
        console.warn('DB fallback also failed:', dbError);
        return [] as SmartMoneyFlow[];
      }

      // Deduplicate by token_symbol (take most recent)
      const seen = new Set<string>();
      const deduped = cacheData.filter(row => {
        if (seen.has(row.token_symbol)) return false;
        seen.add(row.token_symbol);
        return true;
      });

      return deduped
        .filter(row => isFlowFresh(row.last_updated))
        .map(row => ({
          token_symbol: row.token_symbol,
          timeframe: row.timeframe,
          net_flow_usd: Number(row.net_flow_usd),
          total_inflow_usd: Number(row.total_inflow_usd),
          total_outflow_usd: Number(row.total_outflow_usd),
          whale_tx_count: row.whale_tx_count,
          dominant_direction: row.dominant_direction as 'bullish' | 'bearish' | 'neutral',
          flow_intensity: Number(row.flow_intensity),
          ema_flow: Number(row.ema_flow),
          last_updated: row.last_updated,
          confidence_score: normalizeConfidence(row.confidence_score),
          confidence_factors: row.confidence_factors as any,
          whale_transactions_value: Number(row.whale_transactions_value),
          avg_gas_price_gwei: Number(row.avg_gas_price_gwei),
          successful_tx_count: row.successful_tx_count,
        })) as SmartMoneyFlow[];

    },
    staleTime: 90 * 1000,          // 90s — flow data is time-sensitive
    refetchInterval: 2 * 60 * 1000, // refresh every 2 min
    refetchOnWindowFocus: true,
  });

  // Fetch confidence breakdown for detailed analysis
  const { data: confidenceData } = useQuery({
    queryKey: ['confidence-breakdown', symbols.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-money-tracker', {
        body: {
          action: 'get_confidence_breakdown',
          symbols,
          timeframe: '1h',
        },
      });

      if (error) throw error;
      return data?.data || [];
    },
    staleTime: 90 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Process flows into directions with confidence weighting
  useEffect(() => {
    // Empty result is meaningful: it means "no fresh on-chain signal".
    // Clear previous directions instead of keeping the last known ones forever.
    if (!flows || flows.length === 0) {
      setFlowDirections(new Map());
      return;
    }

    const newDirections = new Map<string, FlowDirection>();

    flows.forEach((flow) => {
      let direction: 1 | -1 | 0 = 0;
      let color = FLOW_COLORS.neutral;
      const confidenceScore = isFlowFresh(flow.last_updated)
        ? normalizeConfidence(flow.confidence_score)
        : 0;


      // Determine confidence level
      let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
      if (confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
        confidenceLevel = 'high';
      } else if (confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD) {
        confidenceLevel = 'medium';
      }

      // High confidence signals get special treatment
      const isSmartMoney = confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD;

      if (flow.dominant_direction === 'bullish') {
        direction = 1;
        color = confidenceLevel === 'high' ? FLOW_COLORS.highConfidence : FLOW_COLORS.bullish;
      } else if (flow.dominant_direction === 'bearish') {
        direction = -1;
        color = FLOW_COLORS.bearish;
      }

      // Speed weighted by both intensity AND confidence
      const confidenceMultiplier = 1 + (confidenceScore / 100);
      const intensityMultiplier = 1 + (flow.flow_intensity / 100) * 2;
      const speed = BASE_PARTICLE_SPEED * intensityMultiplier * confidenceMultiplier;

      newDirections.set(flow.token_symbol, {
        symbol: flow.token_symbol,
        direction,
        intensity: flow.flow_intensity,
        color,
        speed,
        confidenceScore,
        confidenceLevel,
        isSmartMoney,
        whaleTxCount: flow.whale_tx_count,
        factors: flow.confidence_factors,
      });
    });

    setFlowDirections(newDirections);
    lastUpdateRef.current = Date.now();
  }, [flows]);

  // Get flow direction with confidence info
  const getFlowDirection = useCallback((symbol: string): FlowDirection => {
    const upperSymbol = symbol.toUpperCase();
    return flowDirections.get(upperSymbol) || {
      symbol: upperSymbol,
      direction: 0,
      intensity: 0,
      color: FLOW_COLORS.neutral,
      speed: BASE_PARTICLE_SPEED,
      confidenceLevel: 'low',
      isSmartMoney: false,
    };
  }, [flowDirections]);

  // Get top smart money signals
  const getTopSmartMoneySignals = useCallback((limit: number = 5): FlowDirection[] => {
    return Array.from(flowDirections.values())
      .filter(f => f.isSmartMoney)
      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))
      .slice(0, limit);
  }, [flowDirections]);

  // Trigger flow update
  const updateFlows = useCallback(async () => {
    try {
      await supabase.functions.invoke('smart-money-tracker', {
        body: {
          action: 'update_flows',
          timeframe: '1h',
        },
      });
      
      await refetch();
    } catch (error) {
      console.error('Error updating smart money flows:', error);
    }
  }, [refetch]);

  // Check data freshness
  const isDataFresh = useCallback(() => {
    if (!flows || flows.length === 0) return false;
    const oldestUpdate = flows.reduce((oldest, flow) => {
      const updateTime = new Date(flow.last_updated).getTime();
      return updateTime < oldest ? updateTime : oldest;
    }, Date.now());
    
    return Date.now() - oldestUpdate < 15 * 60 * 1000;
  }, [flows]);

  // Get average confidence across all flows
  const getAverageConfidence = useCallback(() => {
    if (!flows || flows.length === 0) return 0;
    const total = flows.reduce((sum, f) => sum + normalizeConfidence(f.confidence_score), 0);
    return total / flows.length;
  }, [flows]);

  return {
    flows,
    flowDirections,
    getFlowDirection,
    getTopSmartMoneySignals,
    isLoading,
    error,
    updateFlows,
    isDataFresh,
    refetch,
    confidenceData,
    getAverageConfidence,
  };
}

// ========== PARTICLE FLOW CONFIG HOOK ==========
export function useParticleFlowConfig(flows: SmartMoneyFlow[] | undefined) {
  return useCallback((linkData: { source: { symbol?: string }; target: { symbol?: string }; percentage: number }) => {
    if (!flows || flows.length === 0) {
      return {
        direction: linkData.percentage > 0 ? 1 : -1,
        color: FLOW_COLORS.neutral,
        speed: BASE_PARTICLE_SPEED,
        isSmartMoney: false,
        confidenceLevel: 'low' as const,
      };
    }

    const sourceSymbol = linkData.source.symbol?.toUpperCase();
    const targetSymbol = linkData.target.symbol?.toUpperCase();
    
    const sourceFlow = flows.find(f => f.token_symbol === sourceSymbol);
    const targetFlow = flows.find(f => f.token_symbol === targetSymbol);
    
    // Prioritize flow with higher confidence
    const primaryFlow = 
      ((sourceFlow?.confidence_score || 0) > (targetFlow?.confidence_score || 0)) 
        ? sourceFlow 
        : targetFlow || sourceFlow;

    if (!primaryFlow) {
      return {
        direction: linkData.percentage > 0 ? 1 : -1,
        color: FLOW_COLORS.neutral,
        speed: BASE_PARTICLE_SPEED,
        isSmartMoney: false,
        confidenceLevel: 'low' as const,
      };
    }

    const confidenceScore = primaryFlow.confidence_score || 0;
    const isSmartMoney = confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD;
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    
    if (confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
      confidenceLevel = 'high';
    } else if (confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD) {
      confidenceLevel = 'medium';
    }

    let direction = 0;
    let color = FLOW_COLORS.neutral;

    if (primaryFlow.dominant_direction === 'bullish') {
      direction = 1;
      color = confidenceLevel === 'high' ? FLOW_COLORS.highConfidence : FLOW_COLORS.bullish;
    } else if (primaryFlow.dominant_direction === 'bearish') {
      direction = -1;
      color = FLOW_COLORS.bearish;
    }

    // Speed weighted by confidence
    const confidenceMultiplier = 1 + (confidenceScore / 100);
    const intensityMultiplier = 1 + (primaryFlow.flow_intensity / 100) * 2;

    return {
      direction: direction || (linkData.percentage > 0 ? 1 : -1),
      color,
      speed: BASE_PARTICLE_SPEED * intensityMultiplier * confidenceMultiplier,
      intensity: primaryFlow.flow_intensity,
      isRealData: true,
      isSmartMoney,
      confidenceLevel,
      confidenceScore,
      whaleTxCount: primaryFlow.whale_tx_count,
    };
  }, [flows]);
}

// ========== CONFIDENCE DISPLAY HOOK ==========
export function useConfidenceDisplay(confidenceScore?: number) {
  if (!confidenceScore) {
    return {
      label: 'No Data',
      color: 'text-muted-foreground',
      badge: 'bg-muted',
      icon: '○',
    };
  }

  if (confidenceScore >= HIGH_CONFIDENCE_THRESHOLD) {
    return {
      label: 'High Confidence',
      color: 'text-violet-400',
      badge: 'bg-violet-500/20',
      icon: '◉',
    };
  }

  if (confidenceScore >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return {
      label: 'Smart Money Signal',
      color: 'text-green-400',
      badge: 'bg-green-500/20',
      icon: '◐',
    };
  }

  return {
    label: 'Low Confidence',
    color: 'text-yellow-400',
    badge: 'bg-yellow-500/20',
    icon: '◔',
  };
}
