import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface MatchingTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const MatchingTab = ({ cryptos, selectedCrypto, onSelectCrypto }: MatchingTabProps) => {
  // Filtra ativos que atendem a todos os critérios de entrada
  const matchingCryptos = cryptos
    .filter(c => 
      c.performance > 0 && // Performance positiva vs BTC
      (c.rsi || 0) >= 50 && (c.rsi || 0) <= 60 && // RSI entre 50-60
      c.ema12 && c.ema26 && c.ema12 > c.ema26 && // EMA 12 cruzando EMA 26 para cima
      c.aboveMA14 // Preço acima da média móvel
    )
    .sort((a, b) => b.performance - a.performance);

  return (
    <TabsContent value="matching" className="m-0 h-full">
      <div className="h-full flex flex-col">
        <ColumnHeader 
          title="Match de Entrada" 
          subtitle="Atende todos os critérios" 
        />
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {matchingCryptos.map((crypto) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onClick={() => onSelectCrypto(crypto)}
                isSelected={selectedCrypto.id === crypto.id}
                showRsi={true}
                showRsi4h={true}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TabsContent>
  );
};

export default MatchingTab;