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
  // Filtra ativos em tendência de alta
  const bullishTrend = cryptos
    .filter(c => 
      c.aboveMA14 && // Preço acima da média móvel
      (c.rsi || 0) >= 50 && (c.rsi || 0) <= 70 && // RSI entre 50 e 70
      c.ema12 && c.ema26 && c.ema12 > c.ema26 // EMA 12 > EMA 26
    )
    .sort((a, b) => (b.rsi || 0) - (a.rsi || 0));

  return (
    <TabsContent value="bullish" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Tendência de Alta" 
          subtitle="RSI 50-70 + EMAs" 
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