import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePredictiveSignals } from '@/hooks/usePredictiveSignals';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Target, Clock } from 'lucide-react';

interface PredictiveSignalsPanelProps {
  symbols?: string[];
  className?: string;
}

export const PredictiveSignalsPanel: React.FC<PredictiveSignalsPanelProps> = ({
  symbols = [],
  className
}) => {
  const { signals, loading, refreshSignals, getSignalColor } = usePredictiveSignals({
    symbols,
    enableAlerts: true,
    minConfidence: 0.5 // Reduzido para mostrar mais sinais
  });

  const signalArray = Array.from(signals.values()).sort((a, b) => b.overallScore - a.overallScore);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'sell': return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'hold': return <Activity className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very_low': return 'bg-success/20 text-success-foreground';
      case 'low': return 'bg-success/10 text-success-foreground';
      case 'medium': return 'bg-warning/20 text-warning-foreground';
      case 'high': return 'bg-destructive/20 text-destructive-foreground';
      case 'very_high': return 'bg-destructive/30 text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Insights Preditivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Insights Preditivos
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refreshSignals}>
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {signalArray.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum insight preditivo detectado</p>
            <p className="text-sm">Os insights aparecerão quando condições específicas forem atendidas</p>
          </div>
        ) : (
          signalArray.map((signal) => (
            <div key={signal.symbol} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{signal.symbol}</h3>
                  <Badge 
                    className={`${getRiskColor(signal.riskLevel)} border-0`}
                  >
                    {signal.riskLevel.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {getActionIcon(signal.recommendedAction)}
                  <span className="font-medium capitalize">
                    {signal.recommendedAction}
                  </span>
                  <Badge variant="secondary">
                    {signal.overallScore.toFixed(0)}
                  </Badge>
                </div>
              </div>

              {/* Sinais Explosivos */}
              {signal.explosiveSignals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    🚀 Insights Explosivos ({signal.explosiveSignals.length})
                  </h4>
                  {signal.explosiveSignals.map((explosive, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: getSignalColor('explosive_upside').background,
                        borderColor: getSignalColor('explosive_upside').secondary
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Alta Explosiva</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {(explosive.confidence * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline">
                            +{explosive.targetGain.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {explosive.factors.slice(0, 3).map((factor, fIdx) => (
                          <p key={fIdx} className="text-sm text-muted-foreground">
                            • {factor}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sinais de Borda */}
              {signal.edgeSignals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    📊 Insights de Borda ({signal.edgeSignals.length})
                  </h4>
                  {signal.edgeSignals.map((edge, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: getSignalColor(edge.signalType).background,
                        borderColor: getSignalColor(edge.signalType).secondary
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {edge.signalType.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {(edge.strength * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline">
                            {edge.phase}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Smart Money: {edge.smartMoneyFlow}</span>
                        {edge.volumeAnomaly && <span>🔍 Volume Anômalo</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sinais de Fundo */}
              {signal.bottomSignals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    📉 Insights de Fundo ({signal.bottomSignals.length})
                  </h4>
                  {signal.bottomSignals.map((bottom, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: getSignalColor(bottom.signalType).background,
                        borderColor: getSignalColor(bottom.signalType).secondary
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {bottom.signalType.replace('_', ' ')}
                        </span>
                        <Badge variant="secondary">
                          {(bottom.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Suporte: ${bottom.supportLevel.toFixed(4)}</span>
                        <span>Volume: {bottom.volumeProfile}</span>
                        {bottom.rsiDivergence && <span>📈 RSI Divergência</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dados On-Chain */}
              {signal.onChainData && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium text-sm">Dados On-Chain</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Atividade Baleias:</span>
                      <span className="ml-2 font-medium">{signal.onChainData.whaleActivity}/100</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sentiment:</span>
                      <span className="ml-2 font-medium capitalize">
                        {signal.onChainData.smartMoneySentiment}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Acumulação:</span>
                      <span className="ml-2 font-medium">{signal.onChainData.accumulationScore}/100</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distribuição:</span>
                      <span className="ml-2 font-medium">{signal.onChainData.distributionScore}/100</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado: {new Date(signal.timestamp).toLocaleTimeString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  Score: {signal.overallScore.toFixed(0)}/100
                </Badge>
              </div>

              <Separator />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};