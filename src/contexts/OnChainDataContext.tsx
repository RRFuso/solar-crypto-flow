
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ExchangeFlow, WhaleTransaction } from '@/types/onchain';
import { alternativeOnChainProvider } from '@/services/alternative-onchain';
import { supabase } from '@/integrations/supabase/client';

interface OnChainData {
  whaleTransactions: WhaleTransaction[];
  exchangeFlow: ExchangeFlow | null;
}

interface SmartMoneyScore {
  score: number;
  sentiment: 'Bearish' | 'Neutral' | 'Bullish';
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

    await Promise.all(symbolsToProcess.map(async (symbol) => {
      try {
        // Use alternative on-chain provider
        const metrics = await alternativeOnChainProvider.getTokenMetrics(symbol);
        
        // Convert metrics to our format
        const exchangeFlow: ExchangeFlow = {
          symbol: symbol,
          timestamp: Date.now(),
          netFlow: metrics.netFlow,
          inflow: Math.max(0, metrics.netFlow),
          outflow: Math.max(0, -metrics.netFlow)
        };

        const newData: OnChainData = { 
          whaleTransactions: [], // Using aggregated whale activity instead
          exchangeFlow: exchangeFlow 
        };

        // Convert metrics sentiment to score
        let score = 0;
        if (metrics.sentiment === 'Bullish') score = 7;
        else if (metrics.sentiment === 'Bearish') score = -7;

        const newScore: SmartMoneyScore = {
          score: score,
          sentiment: metrics.sentiment
        };

        console.log(`[OnChainData] Data for ${symbol}:`, { newData, newScore, metrics });

        setOnChainData(prev => new Map(prev).set(symbol, newData));
        setSmartMoneyScores(prev => new Map(prev).set(symbol, newScore));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[OnChainData] Failed to process ${symbol}: ${errorMessage}`);
        
        // Set neutral score on error
        setOnChainData(prev => new Map(prev).set(symbol, { whaleTransactions: [], exchangeFlow: null }));
        setSmartMoneyScores(prev => new Map(prev).set(symbol, { score: 0, sentiment: 'Neutral' }));
      } finally {
        setLoadingSymbols(prev => {
          const newSet = new Set(prev);
          newSet.delete(symbol);
          return newSet;
        });
      }
    }));
  }, [onChainData, loadingSymbols]);

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
