import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CryptoCard from './CryptoCard';
import CryptoChart from './CryptoChart';
import CryptoOcean from './CryptoOcean';
import { AltBtcColumn } from './columns/AltBtcColumn';
import { BtcUsdtColumn } from './columns/BtcUsdtColumn';
import { TopGainersColumn } from './columns/TopGainersColumn';
import { useCryptoData } from '../hooks/useCryptoData';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bitcoin } from 'lucide-react';

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<{ id: string; name: string; performance: number }>({ 
    id: 'BTC', 
    name: 'Bitcoin', 
    performance: 0 
  });
  const [showBtcPairs, setShowBtcPairs] = useState(false);
  const { toast } = useToast();
  
  const { data: cryptoData, isLoading, error, refresh } = useCryptoData();

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error updating data",
        description: "Could not fetch real-time updates",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCryptoSelect = (symbol: string) => {
    const cryptoName = symbol.replace('BTC', '');
    setSelectedCrypto({
      id: cryptoName,
      name: cryptoName,
      performance: cryptoData?.altBtcPairs.find(pair => pair.symbol === symbol)?.priceChange || 0
    });
    setShowBtcPairs(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-3 gap-4 w-full">
          <AltBtcColumn
            data={cryptoData?.altBtcPairs || []}
            onSelect={handleCryptoSelect}
            onRefresh={refresh}
            isLoading={isLoading}
          />
          <BtcUsdtColumn
            data={cryptoData?.btcUsdt || {
              price: '0',
              priceChange: 0,
              volume: '0',
              high24h: '0',
              low24h: '0',
            }}
            onRefresh={refresh}
            isLoading={isLoading}
          />
          <TopGainersColumn
            data={cryptoData?.topGainers || []}
            onSelect={handleCryptoSelect}
            onRefresh={refresh}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 relative">
          <CryptoChart crypto={selectedCrypto} activeTab="all" showBtcPairs={showBtcPairs} />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700"
            onClick={() => {
              setShowBtcPairs(false);
              setSelectedCrypto({ id: 'BTC', name: 'Bitcoin', performance: 0 });
            }}
          >
            <Bitcoin className="w-4 h-4 mr-2" />
            Return to BTC/USDT
          </Button>
        </div>
      </div>
      <CryptoOcean cryptos={cryptoData?.altBtcPairs.map(pair => ({
        id: pair.symbol.replace('BTC', ''),
        name: pair.symbol.replace('BTC', ''),
        performance: pair.priceChange
      })) || []} />
    </div>
  );
};

export default CryptoPanel;