import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface BullishTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const BullishTab = ({ cryptos, selectedCrypto, onSelectCrypto }: BullishTabProps) => {
  console.log('BullishTab received cryptos count:', cryptos.length);
  const bullishTrend = cryptos.sort((a, b) => (b.rsi || 0) - (a.rsi || 0));

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Tendência de Alta" 
        subtitle="RSI 50-70 + EMAs" 
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {bullishTrend.map((crypto) => {
          console.log('Rendering CryptoCard for:', crypto.symbol);
          return (
            <CryptoCard
              key={crypto.id}
              crypto={crypto}
              onClick={() => onSelectCrypto(crypto)}
              isSelected={selectedCrypto.id === crypto.id}
              showRsi={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BullishTab;