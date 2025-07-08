
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ExchangeFlow, WhaleTransaction } from '@/types/onchain';
import { getERC20TokenTransactions, identifyWhaleTransactions, calculateExchangeFlow } from '@/lib/onchain/etherscan';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

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

    // Whale activity analysis
    if (whaleTransactions.length > 0) {
      const whaleBuys = whaleTransactions.filter(tx => tx.to.isExchange === false).length;
      const whaleSells = whaleTransactions.filter(tx => tx.to.isExchange === true).length;
      
      if (whaleBuys > whaleSells) currentScore += 3;
      else if (whaleSells > whaleBuys) currentScore -= 3;
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

    for (const symbol of symbolsToProcess) {
      try {
        let contractInfo = contractAddressesCache.get(symbol.toUpperCase());

        if (!contractInfo) {
          const { data, error } = await supabase
            .from('token_contracts')
            .select('contract_address, chain')
            .eq('symbol', symbol.toUpperCase());

          if (error) {
            throw new Error(`Error fetching contract info for ${symbol} from Supabase: ${error.message}`);
          }

          if (data && data.length > 0) {
            // Prioritize ethereum if available, otherwise take the first one
            const ethContract = data.find(c => c.chain === 'ethereum');
            const selectedData = ethContract || data[0];
            contractInfo = { address: selectedData.contract_address, chain: selectedData.chain || 'ethereum' };
            setContractAddressesCache(prev => new Map(prev).set(symbol.toUpperCase(), contractInfo!));
          } else {
            throw new Error(`Contract info not found for ${symbol} in Supabase.`);
          }
        }

        const transactions = await getERC20TokenTransactions(contractInfo.address, contractInfo.chain, 500);
        const whaleTxs = identifyWhaleTransactions(transactions, 1000, contractInfo.chain);
        const exFlow = calculateExchangeFlow(transactions, symbol, contractInfo.chain);
        
        const newData: OnChainData = { whaleTransactions: whaleTxs, exchangeFlow: exFlow };
        const newScore = calculateSmartMoneyScore(newData);

        console.log(`[OnChainData] Data for ${symbol}:`, { newData, newScore });

        setOnChainData(prev => new Map(prev).set(symbol, newData));
        setSmartMoneyScores(prev => new Map(prev).set(symbol, newScore));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[OnChainData] Failed to process ${symbol}: ${errorMessage}`);
        
        // Set neutral score on error to prevent perpetual loading
        setOnChainData(prev => new Map(prev).set(symbol, { whaleTransactions: [], exchangeFlow: null }));
        setSmartMoneyScores(prev => new Map(prev).set(symbol, { score: 0, sentiment: 'Neutral' }));
      } finally {
        setLoadingSymbols(prev => {
          const newSet = new Set(prev);
          newSet.delete(symbol);
          return newSet;
        });
      }
    }
  }, [onChainData, loadingSymbols, contractAddressesCache]);

  const isLoading = (symbol: string): boolean => loadingSymbols.has(symbol);

  return (
    <OnChainDataContext.Provider value={{ onChainData, smartMoneyScores, isLoading, requestOnChainData }}>
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
