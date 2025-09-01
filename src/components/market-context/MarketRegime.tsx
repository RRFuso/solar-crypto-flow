import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketRegime } from '@/hooks/useMarketRegime';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const RegimeDisplay = ({ regime, btcChange24h }: { regime: string, btcChange24h: number }) => {
  const getRegimeProperties = () => {
    switch (regime) {
      case 'Risk-On':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <TrendingUp className="h-5 w-5 text-green-400" />,
          text: 'Risk-On',
          description: 'Ativos de risco tendem a performar bem.'
        };
      case 'Risk-Off':
        return {
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <TrendingDown className="h-5 w-5 text-red-400" />,
          text: 'Risk-Off',
          description: 'Investidores estão buscando ativos mais seguros.'
        };
      default:
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
          text: 'Neutral',
          description: 'Mercado indefinido, aguardando catalisadores.'
        };
    }
  };

  const { color, icon, text, description } = getRegimeProperties();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">Regime de Mercado</CardTitle>
        <Badge className={`text-sm font-semibold px-3 py-1 ${color}`}>
          {icon}
          <span className="ml-2">{text}</span>
        </Badge>
      </div>
      <p className="text-sm text-slate-400">{description}</p>
      <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
        Baseado na variação de 24h do Bitcoin: 
        <span className={`font-bold ${btcChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {` ${btcChange24h.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
};


export const MarketRegime: React.FC = () => {
  const { data, isLoading, isError, error } = useMarketRegime();

  return (
    <Card className="h-full">
      <CardHeader>
        {/* Title is now inside RegimeDisplay */}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        )}
        {isError && (
          <div className="text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro ao carregar o regime de mercado: {error.message}
          </div>
        )}
        {data && <RegimeDisplay regime={data.regime} btcChange24h={data.btcChange24h} />}
      </CardContent>
    </Card>
  );
};

export default MarketRegime;
