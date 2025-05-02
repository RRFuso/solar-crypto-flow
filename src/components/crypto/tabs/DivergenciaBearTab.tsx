
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { CryptoData } from '@/types/crypto';
import ExplosiveTableHeader from './explosive/ExplosiveTableHeader';
import ExplosiveTableRow from './explosive/ExplosiveTableRow';
import { useDivergenciaBear } from './divergencias/useDivergenciaBear';

interface DivergenciaBearTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const DivergenciaBearTab = ({ cryptos, selectedCrypto, onSelectCrypto }: DivergenciaBearTabProps) => {
  const divergenciaBearCryptos = useDivergenciaBear(cryptos);

  return (
    <div className="p-4 h-full overflow-auto">
      <Table>
        <ExplosiveTableHeader />
        <TableBody>
          {divergenciaBearCryptos.map((crypto) => (
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

export default DivergenciaBearTab;
