import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, Eye, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { useExplosiveSignals } from '@/hooks/useExplosiveSignals';
import { ExplosivePrediction } from '@/lib/ai/explosiveSignalEngine';

interface ExplosiveSignalsPanelProps {
  symbols?: string[];
  className?: string;
}

export const ExplosiveSignalsPanel: React.FC<ExplosiveSignalsPanelProps> = ({ symbols, className }) => {
  const { signals, loading, error, refreshSignals, lastUpdate } = useExplosiveSignals({
    symbols,
    enableAlerts: true,
    refreshInterval: 60000
  });

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case '⚡ Alta probabilidade': return <TrendingUp className="h-4 w-4 text-yellow-400" />;
      case '✨ Moderada probabilidade': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      default: return <TrendingDown className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'setup de compra': return <ShoppingCart className="h-4 w-4 text-green-400" />;
      case 'monitorar': return <Eye className="h-4 w-4 text-blue-400" />;
      case 'aguardar': return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
    if (confidence >= 0.6) return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    if (confidence >= 0.4) return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-200';
      case 'medium': return 'bg-yellow-500/20 text-yellow-200';
      case 'high': return 'bg-red-500/20 text-red-200';
      default: return 'bg-gray-500/20 text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-background/95 backdrop-blur border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🔥 Sinais Explosivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-background/95 backdrop-blur border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-400">
            ⚠️ Erro nos Sinais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={refreshSignals} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const highConfidenceSignals = signals.filter(s => s.confidence >= 0.7);
  const moderateSignals = signals.filter(s => s.confidence >= 0.4 && s.confidence < 0.7);

  return (
    <Card className={`bg-background/95 backdrop-blur border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            🔥 Máquina de Sinais Explosivos
          </CardTitle>
          <Button 
            onClick={refreshSignals} 
            variant="outline" 
            size="sm"
            className="border-orange-500/30 hover:bg-orange-500/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum sinal explosivo detectado no momento</p>
            <p className="text-sm text-muted-foreground mt-2">
              Monitorando {symbols?.length || 'todas as'} criptomoedas...
            </p>
          </div>
        ) : (
          <>
            {/* High Confidence Signals */}
            {highConfidenceSignals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                  ⚡ Sinais de Alta Probabilidade ({highConfidenceSignals.length})
                </h3>
                {highConfidenceSignals.map((signal) => (
                  <SignalCard key={`${signal.symbol}-${signal.timestamp}`} signal={signal} />
                ))}
              </div>
            )}

            {/* Moderate Confidence Signals */}
            {moderateSignals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                  ✨ Sinais Moderados ({moderateSignals.length})
                </h3>
                {moderateSignals.slice(0, 5).map((signal) => (
                  <SignalCard key={`${signal.symbol}-${signal.timestamp}`} signal={signal} />
                ))}
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{highConfidenceSignals.length}</p>
                <p className="text-sm text-muted-foreground">Alta Confiança</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{moderateSignals.length}</p>
                <p className="text-sm text-muted-foreground">Moderada</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {signals.filter(s => s.direction === 'bullish').length}
                </p>
                <p className="text-sm text-muted-foreground">Bullish</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {signals.filter(s => s.direction === 'bearish').length}
                </p>
                <p className="text-sm text-muted-foreground">Bearish</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface SignalCardProps {
  signal: ExplosivePrediction;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case '⚡ Alta probabilidade': return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case '✨ Moderada probabilidade': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      default: return <TrendingDown className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'setup de compra': return <ShoppingCart className="h-4 w-4 text-green-400" />;
      case 'monitorar': return <Eye className="h-4 w-4 text-blue-400" />;
      case 'aguardar': return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
    if (confidence >= 0.6) return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
    if (confidence >= 0.4) return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-200';
      case 'medium': return 'bg-yellow-500/20 text-yellow-200';
      case 'high': return 'bg-red-500/20 text-red-200';
      default: return 'bg-gray-500/20 text-gray-200';
    }
  };

  return (
    <div className="p-4 bg-card/50 border border-border/30 rounded-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">{signal.symbol}</span>
          {getSignalIcon(signal.signalType)}
          <Badge 
            variant="outline" 
            className={getConfidenceColor(signal.confidence)}
          >
            {Math.round(signal.confidence * 100)}%
          </Badge>
          <Badge variant="outline" className={getRiskColor(signal.riskLevel)}>
            {signal.riskLevel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {getRecommendationIcon(signal.recommendation)}
          <span className="text-sm font-medium capitalize">{signal.recommendation}</span>
        </div>
      </div>

      {/* Prediction Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Direção</p>
          <p className={`font-medium ${signal.direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
            {signal.direction === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Tempo</p>
          <p className="font-medium text-foreground">{signal.timeHorizon}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Movimento</p>
          <p className="font-medium text-orange-400">+{signal.expectedMove.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Intervalo</p>
          <p className="font-medium text-foreground">
            {Math.round(signal.confidenceInterval[0] * 100)}-{Math.round(signal.confidenceInterval[1] * 100)}%
          </p>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Fatores Principais:</p>
        <div className="flex flex-wrap gap-2">
          {signal.primaryFactors.map((factor, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {factor}
            </Badge>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div className="text-sm">
        <p className="text-muted-foreground mb-1">Análise:</p>
        <p className="text-foreground italic">{signal.reasoning}</p>
      </div>

      {/* Contributions */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <p className="text-muted-foreground">Anomalia</p>
          <p className="font-medium text-orange-400">{Math.round(signal.anomalyContribution * 100)}%</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Modelo</p>
          <p className="font-medium text-blue-400">{Math.round(signal.modelPrediction * 100)}%</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Social</p>
          <p className="font-medium text-green-400">{Math.round(Math.max(0, signal.sentimentContribution) * 100)}%</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">On-Chain</p>
          <p className="font-medium text-purple-400">{Math.round(signal.onChainContribution * 100)}%</p>
        </div>
      </div>
    </div>
  );
};