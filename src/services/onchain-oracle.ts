import { supabase } from '@/integrations/supabase/client';

export interface OnChainMetrics {
  symbol: string;
  netFlow: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  whaleTransactionCount: number;
  whaleVolumeUSD: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  lastUpdated: string;
}

export interface SmartMoneyScore {
  score: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  factors: string[];
}

/**
 * Fetch real-time on-chain metrics for a symbol using our oracle
 */
export const fetchOnChainMetrics = async (symbol: string): Promise<OnChainMetrics | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('onchain-oracle', {
      body: {
        symbols: [symbol.toUpperCase()],
        action: 'single'
      }
    });

    if (error) {
      console.error(`Error fetching on-chain metrics for ${symbol}:`, error);
      return null;
    }

    if (data?.success && data?.data) {
      return data.data as OnChainMetrics;
    }

    return null;
  } catch (error) {
    console.error(`Error in fetchOnChainMetrics for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch on-chain metrics for multiple symbols
 */
export const fetchBatchOnChainMetrics = async (symbols: string[]): Promise<Map<string, OnChainMetrics>> => {
  const results = new Map<string, OnChainMetrics>();

  try {
    const { data, error } = await supabase.functions.invoke('onchain-oracle', {
      body: {
        symbols: symbols.map(s => s.toUpperCase()),
        action: 'batch_update'
      }
    });

    if (error) {
      console.error('Error fetching batch on-chain metrics:', error);
      return results;
    }

    if (data?.success && data?.data) {
      for (const metrics of data.data) {
        results.set(metrics.symbol, metrics);
      }
    }

    return results;
  } catch (error) {
    console.error('Error in fetchBatchOnChainMetrics:', error);
    return results;
  }
};

/**
 * Calculate smart money score based on on-chain metrics
 */
export const calculateSmartMoneyScore = (metrics: OnChainMetrics): SmartMoneyScore => {
  let score = 0;
  let confidence = 0;
  const factors: string[] = [];

  // Net flow analysis (40% weight)
  if (metrics.netFlow > 5000000) {
    score += 4;
    confidence += 0.4;
    factors.push('Strong net outflow from exchanges');
  } else if (metrics.netFlow > 1000000) {
    score += 2;
    confidence += 0.2;
    factors.push('Moderate net outflow from exchanges');
  } else if (metrics.netFlow < -5000000) {
    score -= 4;
    confidence += 0.4;
    factors.push('Strong net inflow to exchanges');
  } else if (metrics.netFlow < -1000000) {
    score -= 2;
    confidence += 0.2;
    factors.push('Moderate net inflow to exchanges');
  }

  // Whale activity analysis (35% weight)
  if (metrics.whaleVolumeUSD > 50000000) {
    score += 3;
    confidence += 0.35;
    factors.push('High whale volume activity');
  } else if (metrics.whaleVolumeUSD > 10000000) {
    score += 1;
    confidence += 0.15;
    factors.push('Moderate whale activity');
  }

  if (metrics.whaleTransactionCount > 20) {
    score += 1;
    confidence += 0.1;
    factors.push('Multiple whale transactions');
  }

  // Exchange flow patterns (25% weight)
  const flowRatio = metrics.exchangeOutflow / (metrics.exchangeInflow + 1);
  if (flowRatio > 2) {
    score += 2;
    confidence += 0.25;
    factors.push('Strong outflow pattern');
  } else if (flowRatio < 0.5) {
    score -= 2;
    confidence += 0.25;
    factors.push('Strong inflow pattern');
  }

  // Normalize score to -10 to +10 range
  score = Math.max(-10, Math.min(10, score));
  confidence = Math.min(1, confidence);

  let sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  if (score >= 3) {
    sentiment = 'Bullish';
  } else if (score <= -3) {
    sentiment = 'Bearish';
  } else {
    sentiment = 'Neutral';
  }

  return {
    score,
    sentiment,
    confidence,
    factors
  };
};

/**
 * Get cached on-chain data from database
 */
export const getCachedOnChainData = async (symbol: string): Promise<OnChainMetrics | null> => {
  try {
    const { data, error } = await supabase
      .from('crypto_price_action_signals')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error || !data) {
      return null;
    }

    return {
      symbol: data.symbol,
      netFlow: 0, // Will be populated by oracle
      exchangeInflow: 0,
      exchangeOutflow: 0,
      whaleTransactionCount: data.whale_activity || 0,
      whaleVolumeUSD: 0,
      sentiment: (data.smart_money_sentiment as any) || 'Neutral',
      lastUpdated: data.last_updated || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting cached data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Trigger batch update of on-chain data for all tracked symbols
 */
export const triggerBatchUpdate = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('onchain-oracle', {
      body: {
        symbols: ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC'],
        action: 'batch_update'
      }
    });

    if (error) {
      console.error('Error triggering batch update:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error in triggerBatchUpdate:', error);
    return false;
  }
};