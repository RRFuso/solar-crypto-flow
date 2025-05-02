
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { CryptoData } from '@/types/crypto';
import ExplosiveTableHeader from './explosive/ExplosiveTableHeader';
import ExplosiveTableRow from './explosive/ExplosiveTableRow';
import { useDivergenciaBull } from './divergencias/useDivergenciaBull';

interface DivergenciaBullTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const DivergenciaBullTab = ({ cryptos, selectedCrypto, onSelectCrypto }: DivergenciaBullTabProps) => {
  const divergenciaBullCryptos = useDivergenciaBull(cryptos);

  return (
    <div className="p-4 h-full overflow-auto">
      <Table>
        <ExplosiveTableHeader />
        <TableBody>
          {divergenciaBullCryptos.map((crypto) => (
            <ExplosiveTableRow
              key={crypto.id}
              crypto={crypto}
              isSelected={selectedCrypto.id === crypto.id}
              onSelect={onSelectCrypto}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DivergenciaBullTab;
