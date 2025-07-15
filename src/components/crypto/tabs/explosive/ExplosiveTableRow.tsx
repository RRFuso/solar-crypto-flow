import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Rocket, TrendingUp, Check } from 'lucide-react';
import { CryptoData } from '@/types/crypto';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

interface ExplosiveTableRowProps {
  crypto: CryptoData & { 
    score: number;
    criteriaHit: string[];
  };
  isSelected: boolean;
  onSelect: (crypto: CryptoData) => void;
}

const ExplosiveTableRow = ({ crypto, isSelected, onSelect }: ExplosiveTableRowProps) => {
  const isReadyForEntry = crypto.score >= 10;
  const volume = crypto.volume ? crypto.volume : 0;

  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-purple-500/10 transition-colors",
        isSelected ? "bg-purple-500/20" : "",
        isReadyForEntry ? "bg-green-500/10" : ""
      )}
      onClick={() => onSelect(crypto)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {isReadyForEntry && <Rocket className="w-4 h-4 text-green-500" />}
          {crypto.performance > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
          {crypto.id}/USDT
        </div>
      </TableCell>
      <TableCell className={crypto.performance > 0 ? 'text-green-500' : 'text-red-500'}>
        {crypto.performance.toFixed(2)}%
      </TableCell>
      <TableCell>
        {volume > 1000000 
          ? `${(volume / 1000000).toFixed(1)}M`
          : volume > 1000 
            ? `${(volume / 1000).toFixed(1)}K`
            : volume.toFixed(0)
        }
      </TableCell>
      <TableCell>
        {crypto.rsi4h ? crypto.rsi4h.toFixed(1) : 'N/A'}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {crypto.criteriaHit.map((criteria, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="bg-purple-500/10 text-purple-300 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              {criteria}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className={cn(
        "font-semibold",
        crypto.score >= 12 ? "text-green-500" : "text-purple-500"
      )}>
        {crypto.score}
      </TableCell>
    </TableRow>
  );
};

export default ExplosiveTableRow;