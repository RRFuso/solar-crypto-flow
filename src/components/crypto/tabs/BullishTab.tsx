
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface BullishTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const BullishTab: React.FC<BullishTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const bullishSignals = signals
    .filter(s => 
        (s.recommendation === 'buy' || s.recommendation === 'strong_buy') &&
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sinais de Compra" 
        subtitle="Ativos com recomendação de compra pela IA"
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {bullishSignals.map((signal) => (
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
              }}
              onClick={() => onSelectSignal(signal)}
              isSelected={selectedSignal?.symbol === signal.symbol}
              showRsi={false} // O score unificado já considera o RSI
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BullishTab;
