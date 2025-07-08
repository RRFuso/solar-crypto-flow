
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ExchangeFlow, WhaleTransaction } from '@/types/onchain';
import { getERC20TokenTransactions, identifyWhaleTransactions, calculateExchangeFlow } from '@/lib/onchain/etherscan';

// Mapa de exemplo de símbolos para endereços de contrato (mainnet Ethereum)
const TOKEN_CONTRACTS: { [symbol: string]: string } = {
  'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'SHIB': '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
  'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
};

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

  const calculateSmartMoneyScore = (data: OnChainData): SmartMoneyScore => {
    const { exchangeFlow } = data;
    let currentScore = 0;

    if (exchangeFlow) {
      if (exchangeFlow.netFlow < 0) currentScore += 5;
      else if (exchangeFlow.netFlow > 0) currentScore -= 5;
    }
    
    // Adicionar lógica de baleias se necessário
    
    const finalScore = Math.max(-10, Math.min(10, currentScore));
    let sentiment: 'Bearish' | 'Neutral' | 'Bullish' = 'Neutral';
    if (finalScore > 3) sentiment = 'Bullish';
    else if (finalScore < -3) sentiment = 'Bearish';

    return { score: finalScore, sentiment };
  };

  const requestOnChainData = useCallback(async (symbols: string[]) => {
    const symbolsToFetch = symbols.filter(s => !onChainData.has(s) && !loadingSymbols.has(s) && TOKEN_CONTRACTS[s.toUpperCase()]);
    
    if (symbolsToFetch.length === 0) return;

    setLoadingSymbols(prev => new Set([...prev, ...symbolsToFetch]));

    await Promise.all(symbolsToFetch.map(async (symbol) => {
      try {
        const contractAddress = TOKEN_CONTRACTS[symbol.toUpperCase()];
        const transactions = await getERC20TokenTransactions(contractAddress, 500);
        const whaleTxs = identifyWhaleTransactions(transactions, 1000);
        const exFlow = calculateExchangeFlow(transactions, symbol);
        
        const newData: OnChainData = { whaleTransactions: whaleTxs, exchangeFlow: exFlow };
        const newScore = calculateSmartMoneyScore(newData);

        console.log(`[OnChainData] Data for ${symbol}:`, { newData, newScore }); // Log dos dados processados

        setOnChainData(prev => new Map(prev).set(symbol, newData));
        setSmartMoneyScores(prev => new Map(prev).set(symbol, newScore));

      } catch (error) {
        console.error(`Failed to fetch on-chain data for ${symbol}:`, error);
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
