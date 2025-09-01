
import { useOnChainData } from '@/contexts/OnChainDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface OnChainInsightsPanelProps {
  symbol: string;
}

export const OnChainInsightsPanel: React.FC<OnChainInsightsPanelProps> = ({ symbol }) => {
  const { onChainData, smartMoneyScores, isLoading } = useOnChainData();
  const symbolUpper = symbol.toUpperCase();
  const onChainInfo = smartMoneyScores.get(symbolUpper);
  const data = onChainData.get(symbolUpper);

  const getSentimentColor = () => {
    if (onChainInfo?.sentiment === 'Bullish') return 'bg-green-500';
    if (onChainInfo?.sentiment === 'Bearish') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getSentimentIcon = () => {
    if (onChainInfo?.sentiment === 'Bullish') return <TrendingUp className="h-4 w-4" />;
    if (onChainInfo?.sentiment === 'Bearish') return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(0)}`;
  };

  if (isLoading(symbolUpper)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            On-Chain Oracle: {symbolUpper}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-muted-foreground">Coletando dados on-chain em tempo real...</p>
            <Progress value={66} className="w-full" />
            <div className="text-xs text-muted-foreground">
              Integrando Etherscan + Dune Analytics + CoinGecko
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!onChainInfo || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            On-Chain Oracle: {symbolUpper}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum dado on-chain disponível para {symbolUpper}</p>
        </CardContent>
      </Card>
    );
  }

  const progressValue = Math.max(0, Math.min(100, (onChainInfo.score + 10) * 5));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span>Oráculo On-Chain: {symbolUpper}</span>
          </div>
          <Badge className={`${getSentimentColor()} text-white flex items-center gap-1`}>
            {getSentimentIcon()}
            {onChainInfo.sentiment}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Smart Money Score</h3>
            <span className="text-2xl font-bold">{onChainInfo.score}/10</span>
          </div>
          <Progress value={progressValue} className="w-full" />
          {onChainInfo.confidence && (
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Confiança: {(onChainInfo.confidence * 100).toFixed(0)}%</span>
              <span>Atualizado há poucos minutos</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Exchange Flow Metrics */}
        {data.exchangeFlow && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Fluxo Líquido</div>
              <div className={`text-lg font-semibold ${
                data.exchangeFlow.netFlow > 0 ? 'text-green-600' : 
                data.exchangeFlow.netFlow < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {formatCurrency(Math.abs(data.exchangeFlow.netFlow))}
                {data.exchangeFlow.netFlow > 0 ? ' saída' : data.exchangeFlow.netFlow < 0 ? ' entrada' : ''}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Atividade Baleias</div>
              <div className="text-lg font-semibold">
                {data.metrics?.whaleTransactionCount || 0} txns
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(data.metrics?.whaleVolumeUSD || 0)}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Analysis Factors */}
        {onChainInfo.factors && onChainInfo.factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fatores de Análise:</h4>
            <div className="space-y-1">
              {onChainInfo.factors.slice(0, 3).map((factor, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  • {factor}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-2">
          <div className="flex justify-between">
            <span>Fonte: Etherscan + Dune + CoinGecko</span>
            <span>Tempo Real</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
