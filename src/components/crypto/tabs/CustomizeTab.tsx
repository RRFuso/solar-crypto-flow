import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Settings2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CryptoChart from '@/components/CryptoChart';
import { CryptoData } from '@/types/crypto';
import CustomizeSettings from './customize/CustomizeSettings';

interface CustomizeTabProps {
  selectedCrypto: CryptoData;
  onSelectCrypto: (crypto: CryptoData) => void;
}

const CustomizeTab = ({ selectedCrypto }: CustomizeTabProps) => {
  const [settings, setSettings] = React.useState({
    timeframe: '4h',
    indicators: {
      ema: { enabled: true, periods: [9, 21] },
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      volume: { enabled: true, period: 20 }
    }
  });

  return (
    <TabsContent value="customize" className="h-full">
      <Card className="h-full border-0 bg-transparent">
        <div className="flex flex-col h-full gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Setup Personalizado
            </h2>
            <CustomizeSettings 
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>
          <div className="flex-1 min-h-0">
            <CryptoChart 
              crypto={selectedCrypto}
              timeframe={settings.timeframe as "D" | "W" | "240"}
            />
          </div>
        </div>
      </Card>
    </TabsContent>
  );
};

export default CustomizeTab;