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
  const overbought = cryptos
    .filter(c => (c.rsi4h || 0) > 80)
    .sort((a, b) => (b.rsi4h || 0) - (a.rsi4h || 0));

  console.log('Cryptos:', cryptos);
  console.log('Overbought:', overbought);

  return (
    <TabsContent value="overbought" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Sobrecompra 4h" 
          subtitle={`RSI 4h > 80 (${overbought.length} ativos)`}
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {overbought.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
                showRsi4h={true}
              />
            ))}
            {overbought.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Nenhum ativo em sobrecompra no momento
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default OverboughtTab;