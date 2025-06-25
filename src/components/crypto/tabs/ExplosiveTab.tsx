import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { CryptoData } from '@/types/crypto';
import ExplosiveTableHeader from './explosive/ExplosiveTableHeader';
import ExplosiveTableRow from './explosive/ExplosiveTableRow';
import { useExplosiveCryptos } from './explosive/useExplosiveCryptos';

interface ExplosiveTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const ExplosiveTab = ({ cryptos, selectedCrypto, onSelectCrypto }: ExplosiveTabProps) => {
  const explosiveCryptos = useExplosiveCryptos(cryptos);

  return (
    <div className="p-4 h-full overflow-auto">
      <Table>
        <ExplosiveTableHeader />
        <TableBody>
          {explosiveCryptos.map((crypto) => (
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

export default ExplosiveTab;