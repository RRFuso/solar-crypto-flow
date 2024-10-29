import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, TrendingUp, ArrowDownCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  id: string;
  name: string;
  performance: number;
  rsi?: number;
  rsi4h?: number;
}

const fetchCryptoData = async (): Promise<CryptoData[]> => {
  return [
    { id: 'BTC', name: 'Bitcoin', performance: 0, rsi: 45.2, rsi4h: 42.5 },
    { id: 'ETH', name: 'Ethereum', performance: -12.5, rsi: 42.8, rsi4h: 38.6 },
    { id: 'SOL', name: 'Solana', performance: 45.2, rsi: 72.4, rsi4h: 22.4 },
    { id: 'JUP', name: 'Jupiter', performance: 156.7, rsi: 82.6, rsi4h: 18.9 },
    { id: 'ICP', name: 'Internet Computer', performance: 89.3, rsi: 65.8, rsi4h: 24.3 },
    { id: 'KAS', name: 'Kaspa', performance: 234.1, rsi: 78.2, rsi4h: 21.8 },
    { id: 'PENDLE', name: 'Pendle', performance: 167.3, rsi: 68.9, rsi4h: 19.5 },
    { id: 'OM', name: 'Mantra', performance: 78.4, rsi: 58.3, rsi4h: 23.7 },
    { id: 'INJ', name: 'Injective', performance: 321.5, rsi: 85.7, rsi4h: 17.2 },
    { id: 'SUI', name: 'Sui', performance: 145.8, rsi: 75.4, rsi4h: 20.1 },
    { id: 'SEI', name: 'Sei', performance: 178.9, rsi: 70.2, rsi4h: 22.8 },
    { id: 'AVAX', name: 'Avalanche', performance: 67.2, rsi: 63.5, rsi4h: 25.6 },
    { id: 'MATIC', name: 'Polygon', performance: 23.4, rsi: 52.8, rsi4h: 28.4 },
    { id: 'LINK', name: 'Chainlink', performance: 45.6, rsi: 61.3, rsi4h: 26.7 },
    { id: 'NEAR', name: 'Near Protocol', performance: 56.7, rsi: 64.2, rsi4h: 23.9 },
    { id: 'RENDER', name: 'Render', performance: 89.2, rsi: 69.7, rsi4h: 21.3 },
    { id: 'FLOKI', name: 'Floki Inu', performance: 234.5, rsi: 82.1, rsi4h: 19.8 },
    { id: 'PEPE', name: 'Pepe', performance: 345.6, rsi: 88.4, rsi4h: 16.5 },
    { id: 'WIF', name: 'Wif', performance: 456.7, rsi: 86.9, rsi4h: 15.8 },
    { id: 'DOGE', name: 'Dogecoin', performance: 123.4, rsi: 75.6, rsi4h: 24.2 },
    { id: 'BONK', name: 'Bonk', performance: 567.8, rsi: 89.3, rsi4h: 14.7 },
    { id: 'SHIB', name: 'Shiba Inu', performance: 234.5, rsi: 80.2, rsi4h: 20.4 },
    { id: 'MEME', name: 'Memecoin', performance: 345.6, rsi: 85.8, rsi4h: 17.9 },
    { id: 'DOGWIFHAT', name: 'Dog Wif Hat', performance: 456.7, rsi: 87.5, rsi4h: 16.2 },
    { id: 'WOJAK', name: 'Wojak', performance: 234.5, rsi: 79.4, rsi4h: 21.6 },
    { id: 'MYRO', name: 'Myro', performance: 345.6, rsi: 83.7, rsi4h: 18.3 },
    { id: 'TOSHI', name: 'Toshi', performance: 456.7, rsi: 84.9, rsi4h: 17.5 },
  ];
};

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>({ id: 'BTC', name: 'Bitcoin', performance: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  const { data: cryptos = [], isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Update selected crypto when data changes
  React.useEffect(() => {
    const updatedSelectedCrypto = cryptos.find(crypto => crypto.id === selectedCrypto.id);
    if (updatedSelectedCrypto) {
      setSelectedCrypto(updatedSelectedCrypto);
    }
  }, [cryptos, selectedCrypto.id]);

  // Show error toast when query fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao atualizar dados",
        description: "Não foi possível obter as atualizações em tempo real",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (error) return <div className="text-center text-red-500">Erro ao carregar dados</div>;

  const sortedCryptos = [...cryptos].sort((a, b) => {
    if (activeTab === 'uptrend') {
      return (b.rsi || 0) - (a.rsi || 0); // Ordem decrescente por RSI semanal
    } else if (activeTab === 'oversold') {
      return (a.rsi4h || 0) - (b.rsi4h || 0); // Ordem crescente por RSI 4h (mais sobrevendidos primeiro)
    }
    return b.performance - a.performance; // Ordem decrescente por performance
  });
  
  const filteredCryptos = activeTab === 'uptrend' 
    ? sortedCryptos.filter(crypto => (crypto.rsi || 0) > 62)
    : activeTab === 'oversold'
    ? sortedCryptos.filter(crypto => (crypto.rsi4h || 0) < 25)
    : sortedCryptos;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-96 flex flex-col border rounded-lg bg-gray-900/50 overflow-hidden">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-20 bg-gray-800">
            <TabsTrigger value="all" className="flex flex-col items-center gap-1 h-auto py-2">
              <LineChart className="w-4 h-4" />
              <span className="text-xs">BTC vs BTC</span>
            </TabsTrigger>
            <TabsTrigger value="uptrend" className="flex flex-col items-center gap-1 h-auto py-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs whitespace-normal text-center">Tendência de Alta Semanal</span>
            </TabsTrigger>
            <TabsTrigger value="oversold" className="flex flex-col items-center gap-1 h-auto py-2">
              <ArrowDownCircle className="w-4 h-4" />
              <span className="text-xs whitespace-normal text-center">Sobrevenda 4hs</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
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

            <TabsContent value="oversold" className="m-0">
              <div className="p-4 space-y-4">
                {filteredCryptos.map((crypto) => (
                  <CryptoCard
                    key={crypto.id}
                    crypto={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    isSelected={selectedCrypto.id === crypto.id}
                    showRsi4h={true}
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