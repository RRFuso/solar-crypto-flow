import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, Database, Zap } from 'lucide-react';
import { useRealTimeSignals } from '@/hooks/useRealTimeSignals';

export const ExplosiveSignalsPanel: React.FC = () => {
  const { signals, loading, lastUpdate, triggerDataCollection } = useRealTimeSignals();

  if (loading) {
    return (
      <Card className="bg-background/95 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-neon-green via-neon-green/90 to-neon-green/70 bg-clip-text text-transparent">
            🚀 Sinais Explosivos (Dados Reais)
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

  return (
    <Card className="bg-background/95 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-neon-green via-neon-green/90 to-neon-green/70 bg-clip-text text-transparent">
              🚀 Sinais Explosivos (Dados Reais)
            </h2>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground mt-1">
                Última atualização: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={triggerDataCollection}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Database className="h-4 w-4 mr-2" />
              Coletar Dados
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum sinal explosivo detectado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Coletar Dados" para buscar sinais nas APIs reais
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <div key={`${signal.symbol}-${index}`} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-neon-green">{signal.symbol}</h3>
                  <div className="flex items-center gap-2">
                    {signal.explosive_potential && (
                      <Badge variant="outline" className="bg-neon-green/20 text-neon-green border border-neon-green/30">
                        <Zap className="h-3 w-3 mr-1" />
                        {signal.explosive_potential}
                      </Badge>
                    )}
                    {signal.confidence_score && (
                      <Badge variant="outline" className={`${
                        signal.confidence_score > 0.8 
                          ? 'bg-neon-green/20 text-neon-green' 
                          : signal.confidence_score > 0.6 
                          ? 'bg-neon-yellow/20 text-neon-yellow' 
                          : 'bg-neon-red/20 text-neon-red'
                      }`}>
                        {(signal.confidence_score * 100).toFixed(0)}% confiança
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.volume_anomaly ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                      <span>Volume Anômalo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.price_momentum ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                      <span>Momentum Preço</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.social_buzz ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                      <span>Buzz Social</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.whale_activity > 5 ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                      <span>Atividade Whales ({signal.whale_activity})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.technical_breakout ? 'bg-neon-green' : 'bg-gray-500'}`}></div>
                      <span>Breakout Técnico</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${signal.is_accumulation ? 'bg-neon-blue' : 'bg-gray-500'}`}></div>
                      <span>Acumulação</span>
                    </div>
                  </div>
                </div>

                {signal.factors && signal.factors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Fatores:</p>
                    <div className="flex flex-wrap gap-1">
                      {signal.factors.slice(0, 4).map((factor, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-white/10">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {signal.smart_money_sentiment && (
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span>Smart Money:</span>
                    <Badge variant="outline" className={`${
                      signal.smart_money_sentiment === 'bullish' 
                        ? 'bg-neon-green/20 text-neon-green'
                        : signal.smart_money_sentiment === 'bearish'
                        ? 'bg-neon-red/20 text-neon-red'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {signal.smart_money_sentiment}
                    </Badge>
                  </div>
                )}
                
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-muted-foreground">
                    Dados atualizados: {new Date(signal.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};