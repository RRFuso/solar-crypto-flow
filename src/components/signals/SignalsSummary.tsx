import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap, Activity } from 'lucide-react';

interface SignalsSummaryProps {
  className?: string;
}

export const SignalsSummary: React.FC<SignalsSummaryProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Resumo dos Insights Preditivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Explosivos</span>
            </div>
            <Badge variant="outline" className="text-success">
              3 ativos
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Acumulação</span>
            </div>
            <Badge variant="outline" className="text-warning">
              5 ativos
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-info/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-info" />
              <span className="text-sm font-medium">Fundo</span>
            </div>
            <Badge variant="outline" className="text-info">
              2 ativos
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
              <span className="text-sm font-medium">Distribuição</span>
            </div>
            <Badge variant="outline" className="text-destructive">
              1 ativo
            </Badge>
          </div>
        </div>
        
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            Dados baseados em análise técnica real e fluxo on-chain
          </p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span>Volume real</span>
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <span>Suporte/Resistência calculados</span>
            <div className="w-2 h-2 bg-info rounded-full"></div>
            <span>Volatilidade histórica</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};