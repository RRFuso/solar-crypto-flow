import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNarrativeData, Narrative } from '@/hooks/useNarrativeData';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Zap, Flame, TrendingUp, Snowflake } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NarrativeCard = ({ narrative }: { narrative: Narrative }) => {
  const getStatusProperties = () => {
    switch (narrative.status) {
      case 'Hot':
        return {
          color: 'border-red-500/50 bg-red-500/10 text-red-400',
          icon: <Flame className="h-4 w-4" />,
        };
      case 'Trending':
        return {
          color: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
          icon: <TrendingUp className="h-4 w-4" />,
        };
      case 'Cooling':
        return {
          color: 'border-sky-500/50 bg-sky-500/10 text-sky-400',
          icon: <Snowflake className="h-4 w-4" />,
        };
      default:
        return {
          color: 'border-slate-600/50 bg-slate-600/10 text-slate-400',
          icon: <Zap className="h-4 w-4" />,
        };
    }
  };

  const { color, icon } = getStatusProperties();

  return (
    <div className={`p-4 rounded-lg border ${color} flex flex-col justify-between h-full`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-md">{narrative.name}</h3>
          <Badge variant="outline" className={color}>
            {icon}
            <span className="ml-1.5">{narrative.status}</span>
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mb-3">{narrative.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {narrative.tokens.slice(0, 4).map(token => (
          <TooltipProvider key={token}>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="font-mono">{token}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver dados de {token}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export const NarrativeMaps: React.FC = () => {
  const { data: narratives, isLoading, isError, error } = useNarrativeData();

  const sortedNarratives = React.useMemo(() => {
    if (!narratives) return [];
    return [...narratives].sort((a, b) => b.momentum - a.momentum);
  }, [narratives]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Mapa de Narrativas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-700/50 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="h-5 w-10" />
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="text-red-500 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro ao carregar narrativas: {error.message}
          </div>
        )}
        {narratives && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNarratives.map(narrative => (
              <NarrativeCard key={narrative.name} narrative={narrative} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NarrativeMaps;
