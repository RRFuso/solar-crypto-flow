import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { CryptoData } from '@/types/crypto';

interface ExplosiveTabProps {
  cryptos: CryptoData[];
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
  searchTerm: string;
}

const ExplosiveTab = ({ cryptos, selectedCrypto, onSelectCrypto, searchTerm }: ExplosiveTabProps) => {
  console.log('ExplosiveTab received cryptos count:', cryptos.length);

  const getExplosiveColorClass = (change24h: number | undefined) => {
    if (change24h === undefined) return 'bg-gray-900/50';
    if (change24h >= 15) return 'bg-red-600/50'; // Muito Alto
    if (change24h >= 10) return 'bg-orange-500/50'; // Alto
    if (change24h >= 5) return 'bg-yellow-400/50'; // Moderado
    return 'bg-gray-900/50'; // Padrão
  };

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Alta Explosiva" 
        subtitle="Criptomoedas com potencial de alta explosiva" 
      />
      <div className="p-4 border-b border-gray-800">
        <h4 className="text-sm font-semibold text-white mb-2">Legenda de Potencial:</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-600 rounded-full"></span> Muito Alto (>15%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Alto (>10%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-400 rounded-full"></span> Moderado (>5%)
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {filteredCryptos.length > 0 ? (
            filteredCryptos.map((crypto) => {
              console.log(`ExplosiveTab - Rendering ${crypto.symbol} with change24h: ${crypto.change24h}`);
              return (
                <CryptoCard
                  key={crypto.id}
                  crypto={crypto}
                  onClick={() => onSelectCrypto(crypto)}
                  isSelected={selectedCrypto.id === crypto.id}
                  cardClassName={getExplosiveColorClass(crypto.change24h)}
                />
              );
            })
          ) : (
            <div className="text-center text-gray-400">Nenhuma criptomoeda explosiva encontrada.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExplosiveTab;