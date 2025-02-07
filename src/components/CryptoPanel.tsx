
import React, { useState } from 'react';
import { useCryptoData } from '@/hooks/useCryptoData';
import CryptoChart from './CryptoChart';
import FearGreedIndicator from './FearGreedIndicator';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Bitcoin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TabsList from './crypto/TabsList';
import OutperformingTab from './crypto/tabs/OutperformingTab';
import BullishTab from './crypto/tabs/BullishTab';
import OversoldTab from './crypto/tabs/OversoldTab';
import OverboughtTab from './crypto/tabs/OverboughtTab';
import MatchingTab from './crypto/tabs/MatchingTab';
import ExplosiveTab from './crypto/tabs/ExplosiveTab';
import CryptoSettings from './crypto/CryptoSettings';
import { CryptoData } from '@/types/crypto';

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>({ id: 'BTC', name: 'Bitcoin', performance: 0 });
  const [activeTab, setActiveTab] = useState('outperforming');
  const [settings, setSettings] = useState({
    rsiOverbought: 70,
    rsiOversold: 30,
    rsiNeutralMin: 50,
    rsiNeutralMax: 60,
    timeframe: '4h'
  });

  const { data: cryptos = [], isLoading, error } = useCryptoData({
    timeframe: settings.timeframe,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
  });

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
      case 'explosive':
        return '240';
      default:
        return 'D';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 h-[calc(100vh-16rem)]">
        <div className="w-1/2 flex flex-col border border-gray-800 rounded-lg bg-gray-900/30 backdrop-blur-sm overflow-hidden">
          <Tabs 
            defaultValue="outperforming" 
            className="w-full h-full flex flex-col"
            onValueChange={setActiveTab}
          >
            <TabsList />
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <TabsContent value="outperforming" className="m-0 p-0 h-full">
                <OutperformingTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
              <TabsContent value="bullish" className="m-0 p-0 h-full">
                <BullishTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
              <TabsContent value="oversold" className="m-0 p-0 h-full">
                <OversoldTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
              <TabsContent value="overbought" className="m-0 p-0 h-full">
                <OverboughtTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
              <TabsContent value="matching" className="m-0 p-0 h-full">
                <MatchingTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
              <TabsContent value="explosive" className="m-0 p-0 h-full">
                <ExplosiveTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={setSelectedCrypto} 
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="w-1/2 relative">
          <div className="h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900/30 backdrop-blur-sm">
            <CryptoChart 
              crypto={selectedCrypto} 
              timeframe={getTimeframe()}
            />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <CryptoSettings 
              settings={settings}
              onSettingsChange={setSettings}
            />
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
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
