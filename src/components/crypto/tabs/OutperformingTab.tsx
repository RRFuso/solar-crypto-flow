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
  const outperformingBtc = cryptos
    .filter(c => c.performance > 0)
    .sort((a, b) => b.performance - a.performance);

  return (
    <TabsContent value="outperforming" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Alt x BTC" 
          subtitle="Altcoins superando BTC (semanal)" 
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {outperformingBtc.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default OutperformingTab;