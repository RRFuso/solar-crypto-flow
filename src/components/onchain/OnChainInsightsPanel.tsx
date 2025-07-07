
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface OnChainInsightsPanelProps {
  symbol: string;
}

export const OnChainInsightsPanel: React.FC<OnChainInsightsPanelProps> = ({ symbol }) => {
  const { smartMoneyScores, isLoading } = useOnChainData();
  const onChainInfo = smartMoneyScores.get(symbol);

  const getSentimentColor = () => {
    if (onChainInfo?.sentiment === 'Bullish') return 'bg-green-500';
    if (onChainInfo?.sentiment === 'Bearish') return 'bg-red-500';
    return 'bg-gray-500';
  };

  if (isLoading(symbol) || !onChainInfo) {
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
          <Badge className={getSentimentColor()}>{onChainInfo.sentiment}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Smart Money Score: {onChainInfo.score}</h3>
          <Progress value={(onChainInfo.score + 10) * 5} className="w-full mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};
