
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

export const OnChainDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onChainData, setOnChainData] = useState<Map<string, OnChainData>>(new Map());
  const [smartMoneyScores, setSmartMoneyScores] = useState<Map<string, SmartMoneyScore>>(new Map());
  const [loadingSymbols, setLoadingSymbols] = useState<Set<string>>(new Set());
  const [contractAddressesCache, setContractAddressesCache] = useState<Map<string, { address: string; chain: string }>>(new Map());

  const calculateSmartMoneyScore = (data: OnChainData): SmartMoneyScore => {
    const { exchangeFlow, whaleTransactions } = data;
    let currentScore = 0;

    // Exchange flow analysis
    if (exchangeFlow) {
      if (exchangeFlow.netFlow < 0) currentScore += 4; // Net outflow is bullish
      else if (exchangeFlow.netFlow > 0) currentScore -= 4; // Net inflow is bearish
    }

    // Whale activity analysis - simplified for alternative provider
    if (whaleTransactions.length > 0) {
      currentScore += 2; // Presence of whale activity adds to bullish score
    }
    
    const finalScore = Math.max(-10, Math.min(10, currentScore));
    let sentiment: 'Bearish' | 'Neutral' | 'Bullish' = 'Neutral';
    if (finalScore > 2) sentiment = 'Bullish';
    else if (finalScore < -2) sentiment = 'Bearish';

    return { score: finalScore, sentiment };
  };

  const requestOnChainData = useCallback(async (symbols: string[]) => {
    const symbolsToProcess = symbols.filter(s => !onChainData.has(s) && !loadingSymbols.has(s));
    
    if (symbolsToProcess.length === 0) return;

    setLoadingSymbols(prev => new Set([...prev, ...symbolsToProcess]));

    console.log('Fetching real on-chain data for symbols:', symbolsToProcess);
    
    try {
      if (symbolsToProcess.length === 1) {
        // Single symbol - fetch real-time data
        const symbol = symbolsToProcess[0];
        const symbolUpper = symbol.toUpperCase();
        
        // Try cached data first
        let metrics = await getCachedOnChainData(symbolUpper);
        
        // If no cached data or data is stale, fetch fresh data
        if (!metrics || isDataStale(metrics.lastUpdated)) {
          metrics = await fetchOnChainMetrics(symbolUpper);
        }
        
          if (metrics) {
            const exchangeFlow: ExchangeFlow = {
              symbol: symbolUpper,
              timestamp: Date.now(),
              netFlow: metrics.netFlow,
              inflow: metrics.exchangeInflow,
              outflow: metrics.exchangeOutflow
            };

            const newData: OnChainData = {
              whaleTransactions: [],
              exchangeFlow,
              metrics
            };

            const oracleScore = calculateOracleSmartMoneyScore(metrics);
            const smartScore: SmartMoneyScore = {
              score: oracleScore.score,
              sentiment: oracleScore.sentiment,
              confidence: oracleScore.confidence,
              factors: oracleScore.factors
            };

            setOnChainData(prev => new Map(prev).set(symbolUpper, newData));
            setSmartMoneyScores(prev => new Map(prev).set(symbolUpper, smartScore));
          }
      } else {
        // Multiple symbols - use batch processing
        const metricsMap = await fetchBatchOnChainMetrics(symbolsToProcess);
        
        metricsMap.forEach((metrics, symbolUpper) => {
          const exchangeFlow: ExchangeFlow = {
            symbol: symbolUpper,
            timestamp: Date.now(),
            netFlow: metrics.netFlow,
            inflow: metrics.exchangeInflow,
            outflow: metrics.exchangeOutflow
          };

          const newData: OnChainData = {
            whaleTransactions: [],
            exchangeFlow,
            metrics
          };

          const oracleScore = calculateOracleSmartMoneyScore(metrics);
          const smartScore: SmartMoneyScore = {
            score: oracleScore.score,
            sentiment: oracleScore.sentiment,
            confidence: oracleScore.confidence,
            factors: oracleScore.factors
          };

          setOnChainData(prev => new Map(prev).set(symbolUpper, newData));
          setSmartMoneyScores(prev => new Map(prev).set(symbolUpper, smartScore));
        });
      }
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
      // Set neutral scores for failed symbols
      symbolsToProcess.forEach(symbol => {
        const symbolUpper = symbol.toUpperCase();
        setOnChainData(prev => new Map(prev).set(symbolUpper, { whaleTransactions: [], exchangeFlow: null }));
        setSmartMoneyScores(prev => new Map(prev).set(symbolUpper, { score: 0, sentiment: 'Neutral' }));
      });
    } finally {
      setLoadingSymbols(prev => {
        const newSet = new Set(prev);
        symbolsToProcess.forEach(symbol => newSet.delete(symbol));
        return newSet;
      });
    }
  }, [onChainData, loadingSymbols]);

  // Helper function to check if data is stale (older than 5 minutes)
  const isDataStale = (lastUpdated: string): boolean => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return new Date(lastUpdated).getTime() < fiveMinutesAgo;
  };

  const isLoading = (symbol: string): boolean => loadingSymbols.has(symbol);

  return (
    <OnChainDataContext.Provider value={{ onChainData, smartMoneyScores, isLoading, requestOnChainData, contractAddressesCache }}>
      {children}
    </OnChainDataContext.Provider>
  );
};

export const useOnChainData = () => {
  const context = useContext(OnChainDataContext);
  if (context === undefined) {
    throw new Error('useOnChainData must be used within an OnChainDataProvider');
  }
  return context;
};
