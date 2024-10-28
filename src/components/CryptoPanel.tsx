import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, TrendingUp } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
}

const fetchCryptoData = async (): Promise<CryptoData[]> => {
  return [
    { id: 'BTC', name: 'Bitcoin', performance: 0, rsi: 55 },
    { id: 'ETH', name: 'Ethereum', performance: -12.5, rsi: 48 },
    { id: 'SOL', name: 'Solana', performance: 45.2, rsi: 72 },
    { id: 'JUP', name: 'Jupiter', performance: 156.7, rsi: 82 },
    { id: 'ICP', name: 'Internet Computer', performance: 89.3, rsi: 65 },
    { id: 'KAS', name: 'Kaspa', performance: 234.1, rsi: 78 },
    { id: 'PENDLE', name: 'Pendle', performance: 167.3, rsi: 68 },
    { id: 'OM', name: 'Mantra', performance: 78.4, rsi: 58 },
    { id: 'INJ', name: 'Injective', performance: 321.5, rsi: 85 },
    { id: 'SUI', name: 'Sui', performance: 145.8, rsi: 75 },
    { id: 'SEI', name: 'Sei', performance: 178.9, rsi: 70 },
    { id: 'AVAX', name: 'Avalanche', performance: 67.2, rsi: 63 },
    { id: 'MATIC', name: 'Polygon', performance: 23.4, rsi: 52 },
    { id: 'LINK', name: 'Chainlink', performance: 45.6, rsi: 61 },
    { id: 'DOT', name: 'Polkadot', performance: -8.9, rsi: 45 },
    { id: 'ADA', name: 'Cardano', performance: -15.3, rsi: 42 },
    { id: 'XRP', name: 'Ripple', performance: 12.8, rsi: 58 },
    { id: 'ATOM', name: 'Cosmos', performance: 34.5, rsi: 59 },
    { id: 'NEAR', name: 'Near Protocol', performance: 56.7, rsi: 64 },
    { id: 'FTM', name: 'Fantom', performance: 89.2, rsi: 69 },
    { id: 'DOGE', name: 'Dogecoin', performance: -5.3, rsi: 47 },
    { id: 'SHIB', name: 'Shiba Inu', performance: -8.7, rsi: 44 },
    { id: 'UNI', name: 'Uniswap', performance: 23.1, rsi: 57 },
    { id: 'AAVE', name: 'Aave', performance: 34.2, rsi: 62 },
    { id: 'MKR', name: 'Maker', performance: 45.6, rsi: 65 },
    { id: 'SNX', name: 'Synthetix', performance: 67.8, rsi: 71 },
    { id: 'CRV', name: 'Curve', performance: -12.4, rsi: 43 },
    { id: 'LDO', name: 'Lido', performance: 89.3, rsi: 73 },
    { id: 'ARB', name: 'Arbitrum', performance: 45.6, rsi: 64 },
    { id: 'OP', name: 'Optimism', performance: 56.7, rsi: 68 }
  ];
};

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>({ id: 'BTC', name: 'Bitcoin', performance: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
    onError: () => {
      toast({
        title: "Erro ao atualizar dados",
        description: "Não foi possível obter as atualizações em tempo real",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Se o crypto selecionado existir nos novos dados, atualize-o
      const updatedSelectedCrypto = data.find(crypto => crypto.id === selectedCrypto.id);
      if (updatedSelectedCrypto) {
        setSelectedCrypto(updatedSelectedCrypto);
      }
    }
  });

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (error) return <div className="text-center text-red-500">Erro ao carregar dados</div>;

  const sortedCryptos = [...cryptos].sort((a, b) => {
    if (activeTab === 'uptrend') {
      return (b.rsi || 0) - (a.rsi || 0);
    }
    return b.performance - a.performance;
  });
  
  const filteredCryptos = activeTab === 'uptrend' 
    ? sortedCryptos.filter(crypto => (crypto.rsi || 0) > 62)
    : sortedCryptos;

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
                {filteredCryptos.map((crypto) => (
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
                {filteredCryptos.map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    crypto={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    isSelected={selectedCrypto.id === crypto.id}
                    showRsi={true}
                  />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
      <div className="flex-1">
        <CryptoChart crypto={selectedCrypto} activeTab={activeTab} />
      </div>
    </div>
  );
};

export default CryptoPanel;