
import { useState, useEffect } from 'react';
import { getERC20TokenTransactions, identifyWhaleTransactions, calculateExchangeFlow } from '@/lib/onchain/etherscan';
import { WhaleTransaction, ExchangeFlow } from '@/types/onchain';

// Mapa de exemplo de símbolos para endereços de contrato (mainnet Ethereum)
const TOKEN_CONTRACTS: { [symbol: string]: string } = {
  'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Endereço nativo, tratado de forma especial
  'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
  'SHIB': '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
  'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
};

interface OnChainAnalysisResult {
  whaleTransactions: WhaleTransaction[];
  exchangeFlow: ExchangeFlow | null;
  loading: boolean;
  error: string | null;
}

export const useOnChainAnalysis = (symbol: string): OnChainAnalysisResult => {
  const [whaleTransactions, setWhaleTransactions] = useState<WhaleTransaction[]>([]);
  const [exchangeFlow, setExchangeFlow] = useState<ExchangeFlow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnChainData = async () => {
      const contractAddress = TOKEN_CONTRACTS[symbol.toUpperCase()];
      if (!contractAddress) {
        setError(`Contrato não encontrado para o símbolo: ${symbol}`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Buscar transações
        const transactions = await getERC20TokenTransactions(contractAddress, 'ethereum', 1000);
        if (transactions.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Identificar transações de baleias
        const whaleTxs = identifyWhaleTransactions(transactions, 1000, 'ethereum'); // Limiar de 1000 ETH
        setWhaleTransactions(whaleTxs);

        // 3. Calcular fluxo de exchanges
        const exFlow = calculateExchangeFlow(transactions, symbol, 'ethereum');
        setExchangeFlow(exFlow);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchOnChainData();
    }
  }, [symbol]);

  return { whaleTransactions, exchangeFlow, loading, error };
};
