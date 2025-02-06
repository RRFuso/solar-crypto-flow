import React, { useState } from 'react';
import { useCryptoData } from '@/hooks/useCryptoData';
import CryptoChart from './CryptoChart';
import FearGreedIndicator from './FearGreedIndicator';
import { Tabs } from "@/components/ui/tabs";
import { Bitcoin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TabsList from './crypto/TabsList';
import OutperformingTab from './crypto/tabs/OutperformingTab';
import BullishTab from './crypto/tabs/BullishTab';
import OversoldTab from './crypto/tabs/OversoldTab';
import OverboughtTab from './crypto/tabs/OverboughtTab';
import MatchingTab from './crypto/tabs/MatchingTab';
import ExplosiveTab from './crypto/tabs/ExplosiveTab';
import SocialHypeTab from './crypto/tabs/SocialHypeTab';
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
      case 'social':
        return 'D';
      default:
        return 'D';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 h-[calc(100vh-16rem)]">
        <div className="w-1/2 flex flex-col border rounded-lg bg-gray-900/50 overflow-hidden">
          <Tabs 
            defaultValue="outperforming" 
            className="w-full h-full flex flex-col"
            onValueChange={setActiveTab}
          >
            <TabsList />
            <div className="flex-1 min-h-0">
              <OutperformingTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <BullishTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <OversoldTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <OverboughtTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <MatchingTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <ExplosiveTab 
                cryptos={cryptos} 
                selectedCrypto={selectedCrypto} 
                onSelectCrypto={setSelectedCrypto} 
              />
              <SocialHypeTab />
            </div>
          </Tabs>
        </div>

        <div className="w-1/2 relative">
          <CryptoChart 
            crypto={selectedCrypto} 
            timeframe={getTimeframe()}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <CryptoSettings 
              settings={settings}
              onSettingsChange={setSettings}
            />
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