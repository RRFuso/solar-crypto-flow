import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface OutperformingTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const OutperformingTab = ({ cryptos, selectedCrypto, onSelectCrypto }: OutperformingTabProps) => {
  console.log('OutperformingTab received cryptos count:', cryptos.length);
  const outperformingBtc = cryptos.sort((a, b) => b.performance - a.performance);

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Alt x BTC" 
        subtitle="Altcoins superando BTC (semanal)" 
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {outperformingBtc.map((crypto) => {
          console.log('Rendering CryptoCard for:', crypto.symbol);
          return (
            <CryptoCard
              key={crypto.id}
              crypto={crypto}
              onClick={() => onSelectCrypto(crypto)}
              isSelected={selectedCrypto.id === crypto.id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OutperformingTab;