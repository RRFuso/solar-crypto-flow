import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { GapAnalysis } from '@/types/cmeGaps';
import { Progress } from '@/components/ui/progress';

interface GapTableProps {
  gaps: GapAnalysis[];
  isLoading: boolean;
}

export const GapTable: React.FC<GapTableProps> = ({ gaps, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-white/5 hover:bg-white/5">
            <TableHead className="text-xs font-semibold text-muted-foreground">Tipo</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Região do Gap</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Distância</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Probabilidade</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Preenchimento</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gaps.map((analysis, index) => (
            <GapRow key={analysis.gap.id} analysis={analysis} isHighest={index === 0 && !analysis.gap.filled} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface GapRowProps {
  analysis: GapAnalysis;
  isHighest: boolean;
}

const GapRow: React.FC<GapRowProps> = ({ analysis, isHighest }) => {
  const { gap, distancePercent, fillProbability, daysOpen } = analysis;
  const isFilled = gap.filled;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-400';
    if (prob >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProbabilityBg = (prob: number) => {
    if (prob >= 70) return 'bg-green-500/20 border-green-500/30';
    if (prob >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <TableRow 
      className={`
        hover:bg-white/5 transition-colors
        ${isHighest ? 'bg-orange-500/5' : ''}
        ${isFilled ? 'opacity-60' : ''}
      `}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          {gap.type === 'bullish' ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              Alta
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
              <TrendingDown className="h-3 w-3 mr-1" />
              Baixa
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="font-mono text-sm">
          <span className="text-foreground">${gap.gapLow.toLocaleString()}</span>
          <span className="text-muted-foreground mx-1">-</span>
          <span className="text-foreground">${gap.gapHigh.toLocaleString()}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Tamanho: {analysis.gapSizePercent.toFixed(1)}%
        </div>
      </TableCell>

      <TableCell>
        <span className={`font-semibold ${distancePercent < 0 ? 'text-red-400' : 'text-green-400'}`}>
          {distancePercent > 0 ? '+' : ''}{distancePercent.toFixed(1)}%
        </span>
      </TableCell>

      <TableCell>
        {isFilled ? (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Preenchido
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className={`font-bold ${getProbabilityBg(fillProbability)} ${getProbabilityColor(fillProbability)}`}
          >
            {fillProbability}%
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <div className="w-24">
          <Progress 
            value={gap.fillPercentage} 
            className="h-2 bg-white/10"
          />
          <span className="text-xs text-muted-foreground mt-0.5">
            {gap.fillPercentage.toFixed(0)}%
          </span>
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-foreground">
          {gap.createdAt.toLocaleDateString('pt-BR')}
        </div>
        <div className="text-xs text-muted-foreground">
          {daysOpen} dias atrás
        </div>
      </TableCell>
    </TableRow>
  );
};

export default GapTable;
