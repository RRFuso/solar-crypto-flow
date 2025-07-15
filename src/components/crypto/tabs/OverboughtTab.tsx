import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface OverboughtTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const OverboughtTab = ({ cryptos, selectedCrypto, onSelectCrypto }: OverboughtTabProps) => {
  console.log('OverboughtTab received cryptos count:', cryptos.length);
  const overbought = cryptos.sort((a, b) => (b.rsi4h || 0) - (a.rsi4h || 0));

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sobrecompra 4h" 
        subtitle="RSI 4h > 70" 
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {overbought.map((crypto) => {
          console.log('Rendering CryptoCard for:', crypto.symbol);
          return (
            <CryptoCard
              key={crypto.id}
              crypto={crypto}
              onClick={() => onSelectCrypto(crypto)}
              isSelected={selectedCrypto.id === crypto.id}
              showRsi4h={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OverboughtTab;