import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface MatchingTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const MatchingTab = ({ cryptos, selectedCrypto, onSelectCrypto }: MatchingTabProps) => {
  console.log('MatchingTab received cryptos count:', cryptos.length);
  const matchingCryptos = cryptos.sort((a, b) => b.performance - a.performance);

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Baixa" 
        subtitle="Criptomoedas em tendência de baixa" 
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {matchingCryptos.map((crypto) => {
          console.log('Rendering CryptoCard for:', crypto.symbol);
          return (
            <CryptoCard
              key={crypto.id}
              crypto={crypto}
              onClick={() => onSelectCrypto(crypto)}
              isSelected={selectedCrypto.id === crypto.id}
              showRsi={true}
              showRsi4h={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MatchingTab;