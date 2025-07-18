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
  console.log('OversoldTab received cryptos count:', cryptos.length);
  const oversold = cryptos.sort((a, b) => (a.rsi4h || 0) - (b.rsi4h || 0));

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sobrevenda 4h" 
        subtitle={`${cryptos.length} ativos em sobrevenda (RSI 4h < 30)`}
      />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {oversold.length > 0 ? (
          oversold.map((crypto) => {
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
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            Nenhum ativo em sobrevenda no momento
          </div>
        )}
      </div>
    </div>
  );
};

export default OversoldTab;