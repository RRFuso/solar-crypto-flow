import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { TrendingUp } from 'lucide-react';
import { CryptoData } from '@/types/crypto';

interface ExplosiveTableRowProps {
  crypto: CryptoData;
  isSelected: boolean;
  onSelect: (crypto: CryptoData) => void;
}

const ExplosiveTableRow = ({ crypto, isSelected, onSelect }: ExplosiveTableRowProps) => {
  return (
    <TableRow 
      className={`cursor-pointer ${isSelected ? 'bg-purple-500/20' : ''}`}
      onClick={() => onSelect(crypto)}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
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
    </TableRow>
  );
};

export default ExplosiveTableRow;