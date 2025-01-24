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
  const bullishTrend = cryptos
    .filter(c => c.aboveMA14)
    .sort((a, b) => (b.rsi || 0) - (a.rsi || 0));

  return (
    <TabsContent value="bullish" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Tendência de Alta" 
          subtitle="RSI Semanal > 62" 
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {bullishTrend.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
                showRsi={true}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default BullishTab;