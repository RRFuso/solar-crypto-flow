import React, { useState } from 'react';
import { useCryptoData } from '@/hooks/useCryptoData';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';
import FearGreedIndicator from './FearGreedIndicator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, TrendingUp, ArrowDownCircle, ArrowUpCircle, Bitcoin, Activity } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from './crypto/ColumnHeader';

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState({ id: 'BTC', name: 'Bitcoin', performance: 0 });
  const [activeTab, setActiveTab] = useState('outperforming');
  const { toast } = useToast();
  
  const { data: cryptos = [], isLoading, error } = useCryptoData();

  // Filter cryptos based on criteria
  const outperformingBtc = cryptos.filter(c => c.performance > 0).sort((a, b) => b.performance - a.performance);
  const bullishTrend = cryptos.filter(c => c.aboveMA14).sort((a, b) => (b.rsi || 0) - (a.rsi || 0));
  const oversold = cryptos.filter(c => (c.rsi4h || 0) < 20).sort((a, b) => (a.rsi4h || 0) - (b.rsi4h || 0));
  const overbought = cryptos.filter(c => (c.rsi4h || 0) > 80).sort((a, b) => (b.rsi4h || 0) - (a.rsi4h || 0));
  const matchingCryptos = cryptos.filter(c => 
    c.performance > 0 && 
    c.aboveMA14 && 
    (c.rsi4h || 0) < 20
  ).sort((a, b) => b.performance - a.performance);

  // Helper function to determine timeframe based on active tab
  const getTimeframe = () => {
    switch (activeTab) {
      case 'outperforming':
        return 'W';
      case 'bullish':
        return 'W';
      case 'oversold':
        return '240';
      case 'overbought':
        return '240';
      case 'matching':
        return 'D';
      default:
        return 'D';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        <div className="w-[420px] flex flex-col border rounded-lg bg-gray-900/50 overflow-hidden">
          <Tabs 
            defaultValue="outperforming" 
            className="w-full h-full flex flex-col"
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full grid grid-cols-5 h-20 bg-gray-800">
              <TabsTrigger value="outperforming" className="flex flex-col items-center gap-1 h-auto py-2">
                <LineChart className="w-4 h-4" />
                <span className="text-xs">Alt x BTC</span>
              </TabsTrigger>
              <TabsTrigger value="bullish" className="flex flex-col items-center gap-1 h-auto py-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Tendência Alta</span>
              </TabsTrigger>
              <TabsTrigger value="oversold" className="flex flex-col items-center gap-1 h-auto py-2">
                <ArrowDownCircle className="w-4 h-4" />
                <span className="text-xs">Sobrevenda 4h</span>
              </TabsTrigger>
              <TabsTrigger value="overbought" className="flex flex-col items-center gap-1 h-auto py-2">
                <ArrowUpCircle className="w-4 h-4" />
                <span className="text-xs">Sobrecompra 4h</span>
              </TabsTrigger>
              <TabsTrigger value="matching" className="flex flex-col items-center gap-1 h-auto py-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs">Match Entrada</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0">
              <TabsContent value="outperforming" className="m-0 h-full">
                <div className="h-full flex flex-col">
                  <ColumnHeader 
                    title="Alt x BTC" 
                    subtitle="Altcoins superando BTC (semanal)" 
                  />
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {outperformingBtc.map((crypto) => (
                        <CryptoCard
                          key={crypto.id}
                          crypto={crypto}
                          onClick={() => setSelectedCrypto(crypto)}
                          isSelected={selectedCrypto.id === crypto.id}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="bullish" className="m-0 h-full">
                <div className="h-full flex flex-col">
                  <ColumnHeader 
                    title="Tendência de Alta" 
                    subtitle="RSI Semanal > 62" 
                  />
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {bullishTrend.map((crypto) => (
                        <CryptoCard
                          key={crypto.id}
                          crypto={crypto}
                          onClick={() => setSelectedCrypto(crypto)}
                          isSelected={selectedCrypto.id === crypto.id}
                          showRsi={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="oversold" className="m-0 h-full">
                <div className="h-full flex flex-col">
                  <ColumnHeader 
                    title="Sobrevenda 4h" 
                    subtitle="RSI 4h < 20" 
                  />
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {oversold.map((crypto) => (
                        <CryptoCard
                          key={crypto.id}
                          crypto={crypto}
                          onClick={() => setSelectedCrypto(crypto)}
                          isSelected={selectedCrypto.id === crypto.id}
                          showRsi4h={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="overbought" className="m-0 h-full">
                <div className="h-full flex flex-col">
                  <ColumnHeader 
                    title="Sobrecompra 4h" 
                    subtitle="RSI 4h > 80" 
                  />
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {overbought.map((crypto) => (
                        <CryptoCard
                          key={crypto.id}
                          crypto={crypto}
                          onClick={() => setSelectedCrypto(crypto)}
                          isSelected={selectedCrypto.id === crypto.id}
                          showRsi4h={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

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
                          onClick={() => setSelectedCrypto(crypto)}
                          isSelected={selectedCrypto.id === crypto.id}
                          showRsi={true}
                          showRsi4h={true}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex-1 relative">
          <CryptoChart 
            crypto={selectedCrypto} 
            timeframe={getTimeframe()}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800/50 hover:bg-gray-700/50"
              onClick={() => {
                setSelectedCrypto({ id: 'BTC', name: 'Bitcoin', performance: 0 });
              }}
            >
              <Bitcoin className="w-4 h-4 mr-2" />
              BTC/USDT
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <FearGreedIndicator />
      </div>
    </div>
  );
};

export default CryptoPanel;