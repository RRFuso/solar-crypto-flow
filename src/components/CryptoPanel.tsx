import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bitcoin, Coins, TrendingUp } from 'lucide-react';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';

const fetchCryptoData = async () => {
  // Simulated API call - replace with actual TradingView API call
  return [
    { id: 'ETH', name: 'Ethereum', performance: 5.2 },
    { id: 'ADA', name: 'Cardano', performance: 3.7 },
    { id: 'DOT', name: 'Polkadot', performance: 2.1 },
    { id: 'XRP', name: 'Ripple', performance: 1.8 },
    { id: 'SOL', name: 'Solana', performance: 4.5 },
    { id: 'PENDLE', name: 'Pendle', performance: 6.3 },
    { id: 'SUI', name: 'Sui', performance: 7.1 },
    { id: 'SEI', name: 'Sei', performance: 5.9 },
    { id: 'AVAX', name: 'Avalanche', performance: 4.2 },
    { id: 'MATIC', name: 'Polygon', performance: 3.9 },
  ];
};

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
  });

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (error) return <div className="text-center text-red-500">Erro ao carregar dados</div>;

  const sortedCryptos = [...cryptos].sort((a, b) => b.performance - a.performance);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCryptos.map((crypto) => (
          <CryptoCard
            key={crypto.id}
            crypto={crypto}
            onClick={() => setSelectedCrypto(crypto)}
          />
        ))}
      </div>
      {selectedCrypto && (
        <CryptoChart crypto={selectedCrypto} />
      )}
    </div>
  );
};

export default CryptoPanel;