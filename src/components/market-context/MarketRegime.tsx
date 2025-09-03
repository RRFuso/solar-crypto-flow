import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketRegime } from '@/hooks/useMarketRegime';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Brain } from 'lucide-react';

interface FearGreedData {
  value: number;
  classification: string;
}

const FearGreedMiniIndicator = ({ value }: { value: number }) => {
  const getClassification = (value: number): string => {
    if (value <= 20) return "Medo Extremo";
    if (value <= 40) return "Medo";
    if (value <= 60) return "Neutro";
    if (value <= 80) return "Ganância";
    return "Ganância Extrema";
  };

  const getColors = (value: number): { bg: string; text: string } => {
    if (value <= 20) return { bg: "bg-red-500", text: "text-red-400" };
    if (value <= 40) return { bg: "bg-orange-500", text: "text-orange-400" };
    if (value <= 60) return { bg: "bg-yellow-500", text: "text-yellow-400" };
    if (value <= 80) return { bg: "bg-green-500", text: "text-green-400" };
    return { bg: "bg-green-600", text: "text-green-300" };
  };

  const colors = getColors(value);
  const classification = getClassification(value);

  return (
    <div className="space-y-3 p-3 bg-card/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Fear & Greed</span>
        </div>
        <div className={`text-lg font-bold ${colors.text}`}>
          {value}
        </div>
      </div>
      <div className="space-y-2">
        <Progress value={value} className="h-2" />
        <div className="flex justify-between items-center">
          <span className={`text-xs font-medium ${colors.text}`}>
            {classification}
          </span>
          <span className="text-xs text-muted-foreground">
            Índice de Sentimento
          </span>
        </div>
      </div>
    </div>
  );
};

const RegimeDisplay = ({ regime, btcChange24h, fearGreedValue }: { 
  regime: string, 
  btcChange24h: number,
  fearGreedValue: number 
}) => {
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
      
      {/* Fear & Greed Mini Indicator */}
      <FearGreedMiniIndicator value={fearGreedValue} />
      
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
  
  // Fetch Fear & Greed data
  const { data: fearGreedData, isLoading: fearGreedLoading } = useQuery({
    queryKey: ['fear-greed'],
    queryFn: async (): Promise<FearGreedData> => {
      try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        return {
          value: parseInt(data.data[0].value),
          classification: data.data[0].value_classification
        };
      } catch (error) {
        console.error('Error fetching Fear & Greed index:', error);
        // Return a neutral value on error
        return { value: 50, classification: 'Neutral' };
      }
    },
    refetchInterval: 24 * 60 * 60 * 1000, // 24 hours
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: 2,
  });

  const fearGreedValue = fearGreedData?.value ?? 50;

  return (
    <Card className="h-full">
      <CardHeader>
        {/* Title is now inside RegimeDisplay */}
      </CardHeader>
      <CardContent>
        {(isLoading || fearGreedLoading) && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full mt-2" />
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        )}
        {isError && (
          <div className="text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro ao carregar o regime de mercado: {error.message}
          </div>
        )}
        {data && (
          <RegimeDisplay 
            regime={data.regime} 
            btcChange24h={data.btcChange24h}
            fearGreedValue={fearGreedValue} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MarketRegime;
