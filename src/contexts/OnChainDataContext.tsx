import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { ExchangeFlow, WhaleTransaction } from '@/types/onchain';
import {
  fetchOnChainMetrics,
  fetchBatchOnChainMetrics,
  calculateSmartMoneyScore as calculateOracleSmartMoneyScore,
  getCachedOnChainData,
  OnChainMetrics,
  SmartMoneyScore as OracleSmartMoneyScore
} from '@/services/onchain-oracle';

interface OnChainData {
  whaleTransactions: WhaleTransaction[];
  exchangeFlow: ExchangeFlow | null;
  metrics?: OnChainMetrics;
}

interface SmartMoneyScore {
  score: number;
  sentiment: 'Bearish' | 'Neutral' | 'Bullish';
  confidence?: number;
  factors?: string[];
}

interface OnChainDataContextType {
  onChainData: Map<string, OnChainData>;
  smartMoneyScores: Map<string, SmartMoneyScore>;
  isLoading: (symbol: string) => boolean;
  requestOnChainData: (symbols: string[]) => void;
  contractAddressesCache: Map<string, { address: string; chain: string }>;
}

const OnChainDataContext = createContext<OnChainDataContextType | undefined>(undefined);

// How long before we re-fetch on-chain data for the same symbol (ms)
const ON_CHAIN_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isDataStale(lastUpdated: number | undefined): boolean {
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > ON_CHAIN_TTL_MS;
}

export const OnChainDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onChainData, setOnChainData]         = useState<Map<string, OnChainData>>(new Map());
  const [smartMoneyScores, setSmartMoneyScores] = useState<Map<string, SmartMoneyScore>>(new Map());
  const [loadingSymbols, setLoadingSymbols]   = useState<Set<string>>(new Set());
  const [contractAddressesCache]              = useState<Map<string, { address: string; chain: string }>>(new Map());

  // Track last-fetched timestamp per symbol to enforce TTL
  const lastFetchedRef = useRef<Map<string, number>>(new Map());
  // Track in-flight requests to avoid parallel duplicates
  const inFlightRef    = useRef<Set<string>>(new Set());

  const calculateSmartMoneyScore = (data: OnChainData): SmartMoneyScore => {
    const { exchangeFlow, whaleTransactions } = data;
    let score = 0;
    if (exchangeFlow) {
      if (exchangeFlow.netFlow < 0) score += 4;
      else if (exchangeFlow.netFlow > 0) score -= 4;
    }
    if (whaleTransactions.length > 0) score += 2;
    const finalScore = Math.max(-10, Math.min(10, score));
    let sentiment: 'Bearish' | 'Neutral' | 'Bullish' = 'Neutral';
    if (finalScore > 2)  sentiment = 'Bullish';
    if (finalScore < -2) sentiment = 'Bearish';
    return { score: finalScore, sentiment };
  };

  const requestOnChainData = useCallback(async (symbols: string[]) => {
    const now = Date.now();

    // Filter: skip symbols that are in-flight OR whose data is still fresh
    const symbolsToFetch = symbols.filter(s => {
      const upper = s.toUpperCase();
      if (inFlightRef.current.has(upper)) return false;
      const lastFetched = lastFetchedRef.current.get(upper);
      if (lastFetched && (now - lastFetched) < ON_CHAIN_TTL_MS) return false;
      return true;
    });

    if (symbolsToFetch.length === 0) return;

    // Mark all as in-flight
    const upperSymbols = symbolsToFetch.map(s => s.toUpperCase());
    upperSymbols.forEach(s => inFlightRef.current.add(s));
    setLoadingSymbols(prev => new Set([...prev, ...upperSymbols]));

    console.log('[OnChain] Fetching:', upperSymbols);

    try {
      const upsertResults = (metricsMap: Map<string, OnChainMetrics>) => {
        const newData      = new Map(onChainData);
        const newScores    = new Map(smartMoneyScores);
        const fetchedAt    = Date.now();

        metricsMap.forEach((metrics, symbolUpper) => {
          const exchangeFlow: ExchangeFlow = {
            symbol:    symbolUpper,
            timestamp: fetchedAt,
            netFlow:   metrics.netFlow,
            inflow:    metrics.exchangeInflow,
            outflow:   metrics.exchangeOutflow,
          };
          newData.set(symbolUpper, { whaleTransactions: [], exchangeFlow, metrics });

          const oracleScore = calculateOracleSmartMoneyScore(metrics);
          newScores.set(symbolUpper, {
            score:      oracleScore.score,
            sentiment:  oracleScore.sentiment,
            confidence: oracleScore.confidence,
            factors:    oracleScore.factors,
          });

          lastFetchedRef.current.set(symbolUpper, fetchedAt);
        });

        setOnChainData(newData);
        setSmartMoneyScores(newScores);
      };

      if (upperSymbols.length === 1) {
        const sym = upperSymbols[0];
        // Try cache first
        let metrics = await getCachedOnChainData(sym);
        if (!metrics) metrics = await fetchOnChainMetrics(sym);
        if (metrics) upsertResults(new Map([[sym, metrics]]));
      } else {
        // Batch
        const metricsMap = await fetchBatchOnChainMetrics(upperSymbols);
        upsertResults(metricsMap);
      }
    } catch (err) {
      console.error('[OnChain] Error fetching on-chain data:', err);
    } finally {
      upperSymbols.forEach(s => inFlightRef.current.delete(s));
      setLoadingSymbols(prev => {
        const next = new Set(prev);
        upperSymbols.forEach(s => next.delete(s));
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);   // stable — reads Maps via closures but only writes via setters

  const isLoading = useCallback((symbol: string) =>
    loadingSymbols.has(symbol.toUpperCase()), [loadingSymbols]);

  return (
    <OnChainDataContext.Provider value={{
      onChainData, smartMoneyScores, isLoading,
      requestOnChainData, contractAddressesCache,
    }}>
      {children}
    </OnChainDataContext.Provider>
  );
};

export const useOnChainData = () => {
  const ctx = useContext(OnChainDataContext);
  if (!ctx) throw new Error('useOnChainData must be used within OnChainDataProvider');
  return ctx;
};
