import React, { useState, useCallback } from "react";
import { useUnifiedSignalEngine, UnifiedSignal } from "@/hooks/useUnifiedSignalEngine";
import CryptoChart from './CryptoChart';
import { Bitcoin, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const CryptoPanel = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<UnifiedSignal | null>(null);
  const [activeFilter, setActiveFilter] = useState('outperforming');
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({
    timeframe: '4h'
  });

  const { signals, isLoading, error } = useUnifiedSignalEngine(settings.timeframe);
  const allSignals = signals ? Array.from(signals.values()) : [];

  const handleSelectCrypto = useCallback((signal: UnifiedSignal) => {
    setSelectedCrypto(signal);
  }, []);

  const getTimeframe = useCallback(() => {
    // Lógica de timeframe pode ser simplificada ou unificada
    return 'D';
  }, []);

  const renderActiveTab = () => {
    const commonProps = {
      signals: allSignals,
      selectedSignal: selectedCrypto,
      onSelectSignal: handleSelectCrypto,
      searchTerm
    };

    // TODO: Refatorar cada aba para usar `UnifiedSignal`
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
      <div className="w-2/5 flex flex-col border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Criptomoedas</h2>
            <CryptoSettings 
              settings={settings}
              onSettingsChange={setSettings}
            />
          </div>
          <CryptoFilterDropdown
            value={activeFilter}
            onValueChange={setActiveFilter}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {isLoading ? <div>Loading...</div> : renderActiveTab()}
        </div>
      </div>

      <div className="w-3/5 relative">
        <div className="h-full border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-xl overflow-hidden">
          {selectedCrypto && (
            <CryptoChart 
              crypto={{id: selectedCrypto.symbol, name: selectedCrypto.name}} 
              timeframe={getTimeframe()}
              key={`${selectedCrypto.symbol}-${getTimeframe()}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoPanel;