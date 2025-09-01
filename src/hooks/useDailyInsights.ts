import { useQuery } from '@tanstack/react-query';
import mockDailyInsights from '@/lib/data/mockDailyInsights.json';
import { getNormalTransactions } from '@/services/etherscan';

export interface InsightEvidence {
  metric: string;
  value: string;
  source: string;
}

export interface DailyInsight {
  id: string;
  title: string;
  description: string;
  evidence: InsightEvidence[];
  category: 'On-Chain' | 'Fluxo de Capital' | 'Narrativa' | 'Técnico' | 'Social';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const ETH_CHAIN_ID = 1;

export const useDailyInsights = () => {
  return useQuery({
    queryKey: ['dailyInsights'],
    queryFn: async (): Promise<DailyInsight[]> => {
      // Simulate network delay for other insights
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let onChainInsight: DailyInsight | null = null;

      try {
        const transactions = await getNormalTransactions(VITALIK_ADDRESS, ETH_CHAIN_ID, 0, 99999999, 'desc');
        
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const oneDayAgoTimestamp = Math.floor(oneDayAgo.getTime() / 1000);

        const recentTxCount = transactions.filter((tx: any) => parseInt(tx.timeStamp) > oneDayAgoTimestamp).length;

        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (recentTxCount > 10) {
            sentiment = 'Bullish';
        } else if (recentTxCount < 2) {
            sentiment = 'Bearish';
        }

        onChainInsight = {
            id: "insight-eth-activity",
            title: "Atividade na Carteira de Vitalik Buterin",
            description: `A carteira vitalik.eth registrou ${recentTxCount} transações nas últimas 24 horas. Esta atividade pode indicar movimentos de mercado ou alocações para novos projetos.`,
            evidence: [
                { metric: "Transações (24h)", value: `${recentTxCount}`, source: "Etherscan" }
            ],
            category: "On-Chain",
            sentiment: sentiment
        };

      } catch (error) {
        console.error("Failed to fetch on-chain insight:", error);
        // Create a fallback insight on error
        onChainInsight = {
            id: "insight-eth-activity-error",
            title: "Não foi possível carregar o Insight On-Chain",
            description: "Houve um erro ao buscar dados da rede Ethereum. A atividade da rede pode estar congestionada ou o serviço de API pode estar temporariamente indisponível.",
            evidence: [{ metric: "Erro", value: (error as Error).message, source: "Etherscan API" }],
            category: "On-Chain",
            sentiment: "Neutral"
        };
      }

      // Combine the real insight with the mock data, removing the old on-chain mock
      const otherInsights = (mockDailyInsights as DailyInsight[]).filter(
        insight => insight.id !== 'insight-001'
      );

      return [onChainInsight, ...otherInsights];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};
