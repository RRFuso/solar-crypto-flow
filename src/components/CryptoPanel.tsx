import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, TrendingUp } from 'lucide-react';

const fetchCryptoData = async () => {
  // Simulated API call - replace with actual API call in production
  return [
    { id: 'BTC', name: 'Bitcoin', performance: 0 }, // BTC é a referência
    { id: 'ETH', name: 'Ethereum', performance: -12.5 },
    { id: 'SOL', name: 'Solana', performance: 45.2 },
    { id: 'JUP', name: 'Jupiter', performance: 156.7 },
    { id: 'ICP', name: 'Internet Computer', performance: 89.3 },
    { id: 'KAS', name: 'Kaspa', performance: 234.1 },
    { id: 'PENDLE', name: 'Pendle', performance: 167.3 },
    { id: 'OM', name: 'Mantra', performance: 78.4 },
    { id: 'INJ', name: 'Injective', performance: 321.5 },
    { id: 'SUI', name: 'Sui', performance: 145.8 },
    { id: 'SEI', name: 'Sei', performance: 178.9 },
    { id: 'AVAX', name: 'Avalanche', performance: 67.2 },
    { id: 'MATIC', name: 'Polygon', performance: 23.4 },
    { id: 'LINK', name: 'Chainlink', performance: 45.6 },
    { id: 'DOT', name: 'Polkadot', performance: -8.9 },
    { id: 'ADA', name: 'Cardano', performance: -15.3 },
    { id: 'XRP', name: 'Ripple', performance: 12.8 },
    { id: 'ATOM', name: 'Cosmos', performance: 34.5 },
    { id: 'NEAR', name: 'Near Protocol', performance: 56.7 },
    { id: 'FTM', name: 'Fantom', performance: 89.2 }
  ];
};

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState({ id: 'BTC', name: 'Bitcoin' });
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
  });

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (error) return <div className="text-center text-red-500">Erro ao carregar dados</div>;

  const sortedCryptos = [...cryptos].sort((a, b) => b.performance - a.performance);
  const upTrendCryptos = sortedCryptos.filter(crypto => crypto.rsi > 62);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-96 flex flex-col border rounded-lg bg-gray-900/50 overflow-hidden">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              <span>BTC vs BTC</span>
            </TabsTrigger>
            <TabsTrigger value="uptrend" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Tendência de Alta</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0">
              <div className="p-4 space-y-4">
                {sortedCryptos.map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    crypto={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    isSelected={selectedCrypto.id === crypto.id}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="uptrend" className="m-0">
              <div className="p-4 space-y-4">
                {upTrendCryptos.map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    crypto={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    isSelected={selectedCrypto.id === crypto.id}
                  />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
      <div className="flex-1">
        <CryptoChart crypto={selectedCrypto} />
      </div>
    </div>
  );
};

export default CryptoPanel;