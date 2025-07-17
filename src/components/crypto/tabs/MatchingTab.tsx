
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface MatchingTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const MatchingTab: React.FC<MatchingTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const bearishSignals = signals
    .filter(s => 
        (s.recommendation === 'sell' || s.recommendation === 'strong_sell') &&
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Sinais de Venda" 
        subtitle="Ativos com recomendação de venda pela IA"
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {bearishSignals.map((signal) => (
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
              showRsi={false}
              showRsi4h={false}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatchingTab;
