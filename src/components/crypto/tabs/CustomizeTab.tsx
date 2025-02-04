import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import CryptoChart from '@/components/CryptoChart';
import { CryptoData } from '@/types/crypto';

interface CustomizeTabProps {
  selectedCrypto: CryptoData;
  settings: {
    timeframe: string;
    rsiOverbought: number;
    rsiOversold: number;
    rsiNeutralMin: number;
    rsiNeutralMax: number;
  };
}

const CustomizeTab = ({ selectedCrypto, settings }: CustomizeTabProps) => {
  const getTimeframe = () => {
    switch (settings.timeframe) {
      case '15m':
        return '15';
      case '1h':
        return '60';
      case '4h':
        return '240';
      case '1d':
        return 'D';
      default:
        return '240';
    }
  };

  return (
    <TabsContent value="customize" className="h-full">
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <CryptoChart 
            crypto={selectedCrypto}
            timeframe={getTimeframe()}
          />
        </div>
      </div>
    </TabsContent>
  );
};

export default CustomizeTab;