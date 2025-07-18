
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface DivergenciaBearTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
  searchTerm: string;
}

const DivergenciaBearTab = ({ cryptos, selectedCrypto, onSelectCrypto, searchTerm }: DivergenciaBearTabProps) => {
  console.log('DivergenciaBearTab received cryptos count:', cryptos.length);

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Divergência de Baixa" 
        subtitle="Sinais de reversão de alta para baixa" 
      />
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {filteredCryptos.length > 0 ? (
            filteredCryptos.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
              />
            ))
          ) : (
            <div className="text-center text-gray-400">Nenhuma divergência de baixa encontrada.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DivergenciaBearTab;
