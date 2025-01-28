import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CryptoData } from '@/types/crypto';
import { TrendingUp } from 'lucide-react';

interface ExplosiveTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const ExplosiveTab = ({ cryptos, selectedCrypto, onSelectCrypto }: ExplosiveTabProps) => {
  const explosiveCryptos = cryptos.filter(crypto => {
    const hasHighVolume = crypto.volume ? parseFloat(crypto.volume) > 1_000_000 : false;
    const hasSignificantChange = Math.abs(crypto.performance) > 10;
    const hasRsiMomentum = crypto.rsi4h ? crypto.rsi4h > 40 && crypto.rsi4h < 65 : false;
    const isUptrend = crypto.ema12 && crypto.ema26 ? crypto.ema12 > crypto.ema26 : false;
    
    return hasHighVolume && hasSignificantChange && hasRsiMomentum && isUptrend;
  });

  return (
    <div className="p-4 h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Par</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Volume 24h</TableHead>
            <TableHead>RSI 4h</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {explosiveCryptos.map((crypto) => (
            <TableRow 
              key={crypto.id}
              className={`cursor-pointer ${selectedCrypto.id === crypto.id ? 'bg-purple-500/20' : ''}`}
              onClick={() => onSelectCrypto(crypto)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExplosiveTab;