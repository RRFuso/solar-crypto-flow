import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface ExplosiveTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
  searchTerm: string;
}

const ExplosiveTab = ({ cryptos, selectedCrypto, onSelectCrypto, searchTerm }: ExplosiveTabProps) => {
  console.log('ExplosiveTab received cryptos count:', cryptos.length);

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Alta Explosiva" 
        subtitle="Criptomoedas com potencial de alta explosiva" 
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
            <div className="text-center text-gray-400">Nenhuma criptomoeda explosiva encontrada.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExplosiveTab;