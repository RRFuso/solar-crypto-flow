import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target } from 'lucide-react';
import { useSentimentMap } from '@/hooks/useSentimentData';
import { useBatchMLPredictions } from '@/hooks/useMLPredictions';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedAIInsightsProps {
  symbols: string[];
}

export const EnhancedAIInsights: React.FC<EnhancedAIInsightsProps> = ({ symbols }) => {
  const { sentimentMap, isLoading: sentimentLoading } = useSentimentMap(symbols.slice(0, 10));
  const { data: predictions, isLoading: predictionsLoading } = useBatchMLPredictions(symbols.slice(0, 10));

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <TrendingUp className="w-4 h-4" />;
    if (score < -0.3) return <TrendingDown className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getPredictionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      price: 'Preço',
      volatility: 'Volatilidade',
      breakout: 'Rompimento',
      reversal: 'Reversão'
    };
    return labels[type] || type;
  };

  if (sentimentLoading || predictionsLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700 p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  const topOpportunities = predictions
    ?.filter(p => p.confidence > 0.7 && p.prediction_type !== 'volatility')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Sentiment Overview */}
      <Card className="bg-gray-900/50 border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Análise de Sentimento</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from(sentimentMap.values()).slice(0, 6).map(sentiment => (
            <div key={sentiment.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
              <div className="flex items-center gap-2">
                {getSentimentIcon(sentiment.sentiment_score)}
                <span className="font-mono text-sm">{sentiment.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getSentimentColor(sentiment.sentiment_score)}`}>
                  {(sentiment.sentiment_score * 100).toFixed(0)}
                </span>
                <Badge variant={sentiment.sentiment_label === 'positive' ? 'default' : 'secondary'} className="text-xs">
                  {sentiment.sentiment_label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ML Predictions */}
      {topOpportunities && topOpportunities.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Oportunidades de Alta Confiança</h3>
          </div>
          <div className="space-y-3">
            {topOpportunities.map(pred => (
              <div key={pred.id} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{pred.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {getPredictionTypeLabel(pred.prediction_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Confiança:</span>
                    <span className="text-green-400 font-semibold">
                      {(pred.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {pred.predicted_value && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Alvo:</span>
                      <span className="text-white font-semibold">
                        ${pred.predicted_value.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risco:</span>
                    <Badge variant={pred.risk_score > 0.7 ? 'destructive' : pred.risk_score > 0.4 ? 'secondary' : 'default'}>
                      {pred.risk_score > 0.7 ? 'Alto' : pred.risk_score > 0.4 ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Horizonte:</span>
                    <span className="text-white">{pred.prediction_horizon}</span>
                  </div>
                </div>

                {pred.supporting_factors && pred.supporting_factors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-400 block mb-1">Fatores:</span>
                    <div className="flex flex-wrap gap-1">
                      {pred.supporting_factors.slice(0, 3).map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};