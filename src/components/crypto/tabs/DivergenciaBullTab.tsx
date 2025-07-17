import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface DivergenciaBullTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const DivergenciaBullTab: React.FC<DivergenciaBullTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const bullishDivergenceSignals = signals
    .filter(s => 
        s.prediction.divergenceBullish && // Filter for bullish divergence
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore); // Sort by overallScore

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Divergência de Alta" 
        subtitle="Sinais de reversão de baixa para alta"
      />
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {bullishDivergenceSignals.length > 0 ? (
            bullishDivergenceSignals.map((signal) => (
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
              />
            ))
          ) : (
            <div className="text-center text-gray-400">Nenhuma divergência de alta encontrada.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DivergenciaBullTab;