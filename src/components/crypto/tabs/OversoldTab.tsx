import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface OversoldTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const OversoldTab = ({ cryptos, selectedCrypto, onSelectCrypto }: OversoldTabProps) => {
  // Filtra ativos em sobrevenda (RSI 4h < 30)
  const oversold = cryptos
    .filter(c => (c.rsi4h || 0) < 30)
    .sort((a, b) => (a.rsi4h || 0) - (b.rsi4h || 0));

  return (
    <TabsContent value="oversold" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Sobrevenda 4h" 
          subtitle="RSI 4h < 30" 
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {oversold.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
                showRsi4h={true}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default OversoldTab;