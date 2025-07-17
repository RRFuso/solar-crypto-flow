
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface OversoldTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const OversoldTab: React.FC<OversoldTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const oversoldSignals = signals
    .filter(s => 
        (s.prediction.rsi < 30 || s.prediction.rsi4h < 30) && // Check RSI for oversold
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.prediction.rsi || 0) - (b.prediction.rsi || 0)); // Sort by RSI (lowest first)

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sobrevendido" 
        subtitle="Ativos com RSI < 30 (4h ou 24h)"
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {oversoldSignals.length > 0 ? (
            oversoldSignals.map((signal) => (
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
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum ativo em sobrevenda no momento
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OversoldTab;
