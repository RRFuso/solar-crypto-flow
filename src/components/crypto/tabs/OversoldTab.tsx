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
  // Filter assets in oversold condition (RSI 4h < 30) and sort by RSI value
  const oversold = cryptos
    .filter(c => {
      const rsi = c.rsi4h || 0;
      // Ensure we have valid RSI values and price data
      return rsi > 0 && rsi < 30 && c.price && parseFloat(c.price) > 0;
    })
    .sort((a, b) => (a.rsi4h || 0) - (b.rsi4h || 0));

  console.log('Oversold cryptos:', oversold.length);

  return (
    <TabsContent value="oversold" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Sobrevenda 4h" 
          subtitle={`${oversold.length} ativos em sobrevenda (RSI 4h < 30)`}
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {oversold.length > 0 ? (
              oversold.map((crypto) => (
                <CryptoCard
                  key={crypto.id}
                  crypto={crypto}
                  onClick={() => onSelectCrypto(crypto)}
                  isSelected={selectedCrypto.id === crypto.id}
                  showRsi4h={true}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                Nenhum ativo em sobrevenda no momento
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default OversoldTab;