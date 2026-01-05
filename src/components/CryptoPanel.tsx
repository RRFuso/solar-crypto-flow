
import React, { useState, useCallback, useMemo } from "react";
import { useCryptoData } from "@/hooks/useCryptoData";
import CryptoChart from './CryptoChart';
import { Bitcoin, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CryptoFilterDropdown from './crypto/CryptoFilterDropdown';
import OutperformingTab from './crypto/tabs/OutperformingTab';
import BullishTab from './crypto/tabs/BullishTab';
import MatchingTab from './crypto/tabs/MatchingTab'; 
import OverboughtTab from './crypto/tabs/OverboughtTab';
import OversoldTab from './crypto/tabs/OversoldTab';
import DivergenciaBullTab from './crypto/tabs/DivergenciaBullTab';
import DivergenciaBearTab from './crypto/tabs/DivergenciaBearTab';
import ExplosiveTab from './crypto/tabs/ExplosiveTab';
import CryptoSettings from './crypto/CryptoSettings';
import { CryptoData } from '@/types/crypto';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import { WebSocketIndicator } from '@/components/ui/WebSocketIndicator';

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>({ id: 'BTC', name: 'Bitcoin', performance: 0 });
  const [activeFilter, setActiveFilter] = useState('outperforming');
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({
    rsiOverbought: 70,
    rsiOversold: 30,
    rsiNeutralMin: 50,
    rsiNeutralMax: 60,
    timeframe: '4h'
  });
  const [dataSource, setDataSource] = useState<'coingecko' | 'binance'>('coingecko'); // New state for data source

  const { data: cryptos = [], isLoading, error } = useCryptoData({
    timeframe: settings.timeframe,
    rsiOverbought: settings.rsiOverbought,
    rsiOversold: settings.rsiOversold,
    filter: activeFilter,
    dataSource: dataSource, // Pass the data source
  });

  // Extract symbols for WebSocket subscription
  const wsSymbols = useMemo(() => 
    cryptos.slice(0, 50).map(c => (c.symbol || c.id).toUpperCase()),
    [cryptos]
  );
  
  // Subscribe to WebSocket for all visible cryptos
  const { isConnected: wsConnected } = useBinanceWebSocket(wsSymbols);

  console.log("CryptoPanel - isLoading:", isLoading);
  console.log("CryptoPanel - error:", error);
  console.log("CryptoPanel - cryptos count:", cryptos.length);
  console.log("CryptoPanel - WebSocket connected:", wsConnected);

  const handleSelectCrypto = useCallback((crypto: CryptoData) => {
    setSelectedCrypto(crypto);
  }, []);

  const getTimeframe = useCallback(() => {
    switch (activeFilter) {
      case 'outperforming':
        return 'W';
      case 'bullish':
        return 'W';
      case 'oversold':
        return '240';
      case 'overbought':
        return '240';
      case 'bearish':
        return 'D';
      case 'explosive':
        return 'D'; // Or a more appropriate timeframe for explosive
      default:
        return 'D';
    }
  }, [activeFilter]);

  const renderActiveTab = () => {
    const commonProps = {
      cryptos,
      selectedCrypto,
      onSelectCrypto: handleSelectCrypto,
      searchTerm
    };

    switch (activeFilter) {
      case 'outperforming':
        return <OutperformingTab {...commonProps} />;
      case 'bullish':
        return <BullishTab {...commonProps} />;
      case 'bearish':
        return <MatchingTab {...commonProps} />;
      case 'overbought':
        return <OverboughtTab {...commonProps} />;
      case 'oversold':
        return <OversoldTab {...commonProps} />;
      case 'div-bull':
        return <DivergenciaBullTab {...commonProps} />;
      case 'div-bear':
        return <DivergenciaBearTab {...commonProps} />;
      case 'explosive':
        return <ExplosiveTab {...commonProps} />;
      default:
        return <OutperformingTab {...commonProps} />;
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left panel - Crypto list */}
      <div className="w-2/5 flex flex-col border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
        {/* Header with filters */}
        <div className="p-4 border-b border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Criptomoedas</h2>
              <WebSocketIndicator isConnected={wsConnected} showLabel />
            </div>
            <CryptoSettings 
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>
          
          {/* Filter dropdown */}
          <CryptoFilterDropdown
            value={activeFilter}
            onValueChange={setActiveFilter}
          />
          <div>
            <Label>Data Source</Label>
            <Select value={dataSource} onValueChange={(value) => setDataSource(value as 'coingecko' | 'binance')}>
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coingecko">CoinGecko</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0">
          {renderActiveTab()}
        </div>
      </div>

      {/* Right panel - Chart */}
      <div className="w-3/5 relative">
        <div className="h-full border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
          <CryptoChart 
            crypto={selectedCrypto} 
            timeframe={getTimeframe()}
            key={`${selectedCrypto.id}-${getTimeframe()}-${dataSource}`}
          />
        </div>
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
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
  );
};

export default CryptoPanel;
