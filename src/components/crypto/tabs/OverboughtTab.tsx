
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface OverboughtTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const OverboughtTab: React.FC<OverboughtTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const overboughtSignals = signals
    .filter(s => 
        (s.prediction.rsi > 70 || s.prediction.rsi4h > 70) && // Check RSI for overbought
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.prediction.rsi || 0) - (a.prediction.rsi || 0)); // Sort by RSI

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sobrecomprado" 
        subtitle="Ativos com RSI > 70 (4h ou 24h)"
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {overboughtSignals.map((signal) => (
            <CryptoCard
              key={signal.symbol}
              crypto={{
                id: signal.symbol,
                name: signal.name,
                performance: signal.overallScore,
                price: parseFloat(signal.prediction.price || '0'),
                change24h: signal.prediction.bullish ? 1 : -1,
                marketCap: 0,
                volume: 0,
                rsi: signal.prediction.rsi,
                rsi4h: signal.prediction.rsi4h,
              }}
              onClick={() => onSelectSignal(signal)}
              isSelected={selectedSignal?.symbol === signal.symbol}
              showRsi={true}
              showRsi4h={true}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OverboughtTab;
