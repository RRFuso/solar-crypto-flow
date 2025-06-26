import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Target } from 'lucide-react';

interface ExplosiveOpportunitiesPanelProps {
  predictions: Prediction[];
  onNavigateToChart?: (symbol: string) => void;
}

export const ExplosiveOpportunitiesPanel: React.FC<ExplosiveOpportunitiesPanelProps> = ({
  predictions,
  onNavigateToChart
}) => {
  // Filtrar e ordenar oportunidades explosivas
  const explosiveOpportunities = useMemo(() => {
    return predictions
      .filter(p => 
        p.confidence >= 0.7 && 
        (p.explosivePotential === 'High' || p.explosivePotential === 'Medium' || p.isBreakout || p.isAccelerating)
      )
      .sort((a, b) => {
        // Priorizar por potencial explosivo e confiança
        const aScore = (a.confidence * 100) + 
          (a.explosivePotential === 'High' ? 30 : a.explosivePotential === 'Medium' ? 20 : 10) +
          (a.isBreakout ? 15 : 0) + 
          (a.isAccelerating ? 10 : 0);
        const bScore = (b.confidence * 100) + 
          (b.explosivePotential === 'High' ? 30 : b.explosivePotential === 'Medium' ? 20 : 10) +
          (b.isBreakout ? 15 : 0) + 
          (b.isAccelerating ? 10 : 0);
        return bScore - aScore;
      })
      .slice(0, 8); // Limitar a 8 oportunidades
  }, [predictions]);

  const getExplosiveIcon = (prediction: Prediction) => {
    if (prediction.explosivePotential === 'High') return '🚀';
    if (prediction.isBreakout) return '💥';
    if (prediction.isAccelerating) return '⚡';
    return '📈';
  };

  const getExplosiveColor = (prediction: Prediction) => {
    if (prediction.explosivePotential === 'High') return 'from-red-500 to-orange-500';
    if (prediction.explosivePotential === 'Medium') return 'from-orange-500 to-yellow-500';
    if (prediction.isBreakout) return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-cyan-500';
  };

  const handleViewChart = (symbol: string) => {
    if (onNavigateToChart) {
      onNavigateToChart(symbol);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 p-4 border-b border-gray-700">
        <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          🔥 Oportunidades Explosivas
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
            {explosiveOpportunities.length}
          </Badge>
        </CardTitle>
        <p className="text-xs text-gray-400">
          Ativos com alto potencial de movimento explosivo
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-y-auto">
        {explosiveOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              Nenhuma oportunidade explosiva detectada no momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {explosiveOpportunities.map((prediction, index) => (
              <Card 
                key={prediction.symbol}
                className={`bg-gradient-to-r ${getExplosiveColor(prediction)} p-[1px] rounded-lg hover:shadow-lg transition-all duration-300`}
              >
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={getCryptoLogoUrl(prediction.symbol)}
                        alt={prediction.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{prediction.symbol}</h4>
                        <p className="text-xs text-gray-400">{prediction.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{getExplosiveIcon(prediction)}</span>
                      <div className={`flex items-center gap-1 ${prediction.bullish ? 'text-green-400' : 'text-red-400'}`}>
                        {prediction.bullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span className="text-xs font-medium">{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges de sinais */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prediction.explosivePotential && prediction.explosivePotential !== 'None' && (
                      <Badge className={`text-xs bg-gradient-to-r ${getExplosiveColor(prediction)} text-white`}>
                        {prediction.explosivePotential} Potential
                      </Badge>
                    )}
                    {prediction.isBreakout && (
                      <Badge className="text-xs bg-purple-900/50 text-purple-300 border border-purple-500/30">
                        💥 Breakout
                      </Badge>
                    )}
                    {prediction.isAccelerating && (
                      <Badge className="text-xs bg-blue-900/50 text-blue-300 border border-blue-500/30">
                        ⚡ Aceleração
                      </Badge>
                    )}
                  </div>

                  {/* Fatores principais */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Fatores principais:</p>
                    <div className="space-y-1">
                      {prediction.factors.slice(0, 2).map((factor, idx) => (
                        <p key={idx} className="text-xs text-gray-300">• {factor}</p>
                      ))}
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        #{index + 1} Ranking
                      </Badge>
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleViewChart(prediction.symbol)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs px-3 py-1 h-7"
                    >
                      Ver Gráfico
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};