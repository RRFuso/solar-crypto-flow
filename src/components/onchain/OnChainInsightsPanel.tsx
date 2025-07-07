
import React from 'react';
import { useSmartMoneyScore } from '@/hooks/useSmartMoneyScore';
import { useOnChainAnalysis } from '@/hooks/useOnChainAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface OnChainInsightsPanelProps {
  symbol: string;
}

export const OnChainInsightsPanel: React.FC<OnChainInsightsPanelProps> = ({ symbol }) => {
  const { score, sentiment, loading: loadingScore, factors } = useSmartMoneyScore(symbol);
  const { whaleTransactions, loading: loadingTxs } = useOnChainAnalysis(symbol);

  const isLoading = loadingScore || loadingTxs;

  const getSentimentColor = () => {
    if (sentiment === 'Bullish') return 'bg-green-500';
    if (sentiment === 'Bearish') return 'bg-red-500';
    return 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Chain Insights: {symbol.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Analisando dados on-chain...</p>
          <Progress value={50} className="w-full mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>On-Chain Insights: {symbol.toUpperCase()}</span>
          <Badge className={getSentimentColor()}>{sentiment}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Smart Money Score: {score}</h3>
          <Progress value={(score + 10) * 5} className="w-full mt-1" />
          <div className="mt-2">
            {factors.map((factor, i) => (
              <p key={i} className="text-xs text-gray-400">{factor}</p>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Whale Transactions (Last 24h)</h3>
          <div className="mt-2 space-y-2">
            {whaleTransactions.length > 0 ? (
              whaleTransactions.slice(0, 5).map((tx) => (
                <div key={tx.hash} className="text-xs p-2 bg-gray-800 rounded">
                  <p>
                    <span className="font-bold text-blue-400">De:</span> {tx.from.slice(0, 10)}...
                    <span className="font-bold text-blue-400 ml-2">Para:</span> {tx.to.slice(0, 10)}...
                  </p>
                  <p>
                    <span className="font-bold">Valor:</span> {(parseFloat(tx.value) / 1e18).toFixed(2)} ETH
                  </p>
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Ver na Etherscan
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Nenhuma transação de baleia detectada recentemente.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
