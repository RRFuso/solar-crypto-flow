import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Rocket, TrendingUp } from 'lucide-react';
import { CryptoData } from '@/types/crypto';
import { cn } from '@/lib/utils';

interface ExplosiveTableRowProps {
  crypto: CryptoData & { score: number };
  isSelected: boolean;
  onSelect: (crypto: CryptoData) => void;
}

const ExplosiveTableRow = ({ crypto, isSelected, onSelect }: ExplosiveTableRowProps) => {
  const isReadyForEntry = crypto.score >= 90;

  return (
    <TableRow 
      className={cn(
        "cursor-pointer",
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
        {crypto.volume ? parseInt(crypto.volume).toLocaleString() : 'N/A'}
      </TableCell>
      <TableCell>
        {crypto.rsi4h ? crypto.rsi4h.toFixed(2) : 'N/A'}
      </TableCell>
      <TableCell className="text-purple-500 font-semibold">
        {crypto.score}
      </TableCell>
    </TableRow>
  );
};

export default ExplosiveTableRow;