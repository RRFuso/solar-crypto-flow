
import React, { useState, useEffect, useCallback } from "react";
import { useCryptoData } from "@/hooks/useCryptoData";
import CryptoChart from './CryptoChart';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Bitcoin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TabsList from './crypto/TabsList';
import OutperformingTab from './crypto/tabs/OutperformingTab';
import BullishTab from './crypto/tabs/BullishTab';
import OverboughtTab from './crypto/tabs/OverboughtTab';
import OversoldTab from './crypto/tabs/OversoldTab';
import DivergenciaBullTab from './crypto/tabs/DivergenciaBullTab';
import DivergenciaBearTab from './crypto/tabs/DivergenciaBearTab';
import CryptoSettings from './crypto/CryptoSettings';
import { CryptoData } from '@/types/crypto';

// Define the allowed timeframe values to match CryptoChart's requirements
type ChartTimeframe = "D" | "W" | "240" | "5" | "15" | "30";

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
  
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('D'); // Explicitly typed as ChartTimeframe

  const { data: cryptos = [], isLoading, error } = useCryptoData({
    timeframe: settings.timeframe,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold
  });

  // Memoized handler to prevent unnecessary re-renders
  const handleSelectCrypto = useCallback((crypto: CryptoData) => {
    setSelectedCrypto(crypto);
  }, []);

  // Memoized function to get timeframe
  const getTimeframe = useCallback((): ChartTimeframe => {
    switch (activeTab) {
      case 'outperforming':
        return 'W';
      case 'bullish':
        return 'W';
      case 'oversold':
        return '240';
      case 'overbought':
        return '240';
      case 'div-bull':
        return 'D';
      case 'div-bear':
        return 'D';
      default:
        return chartTimeframe;
    }
  }, [activeTab, chartTimeframe]);
  
  const handleTimeframeChange = (value: string) => {
    // Validate that the value is one of our allowed timeframes before setting it
    if (value === "5" || value === "15" || value === "30" || value === "240" || value === "D" || value === "W") {
      setChartTimeframe(value as ChartTimeframe);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        <div className="w-2/5 flex flex-col border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
          <Tabs 
            defaultValue="outperforming" 
            className="w-full h-full flex flex-col"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 min-h-0">
              <TabsContent value="outperforming" className="h-full p-0 m-0">
                <OutperformingTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
              <TabsContent value="bullish" className="h-full p-0 m-0">
                <BullishTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
              <TabsContent value="oversold" className="h-full p-0 m-0">
                <OversoldTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
              <TabsContent value="overbought" className="h-full p-0 m-0">
                <OverboughtTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
              <TabsContent value="div-bull" className="h-full p-0 m-0">
                <DivergenciaBullTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
              <TabsContent value="div-bear" className="h-full p-0 m-0">
                <DivergenciaBearTab 
                  cryptos={cryptos} 
                  selectedCrypto={selectedCrypto} 
                  onSelectCrypto={handleSelectCrypto} 
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="w-3/5 relative">
          <div className="h-full border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
            <CryptoChart 
              crypto={selectedCrypto} 
              timeframe={getTimeframe()}
              key={`${selectedCrypto.id}-${getTimeframe()}`}
            />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <Select value={chartTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-24 bg-gray-800/50 hover:bg-gray-700/50">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5min</SelectItem>
                <SelectItem value="15">15min</SelectItem>
                <SelectItem value="30">30min</SelectItem>
                <SelectItem value="240">4h</SelectItem>
                <SelectItem value="D">Daily</SelectItem>
                <SelectItem value="W">Weekly</SelectItem>
              </SelectContent>
            </Select>
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
    </div>
  );
};

export default CryptoPanel;
