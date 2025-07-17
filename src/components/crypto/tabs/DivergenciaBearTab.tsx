import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface DivergenciaBearTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const DivergenciaBearTab: React.FC<DivergenciaBearTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const bearishDivergenceSignals = signals
    .filter(s => 
        s.prediction.divergenceBearish && // Filter for bearish divergence
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore); // Sort by overallScore

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Divergência de Baixa" 
        subtitle="Sinais de reversão de alta para baixa"
      />
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {bearishDivergenceSignals.length > 0 ? (
            bearishDivergenceSignals.map((signal) => (
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
            <div className="text-center text-gray-400">Nenhuma divergência de baixa encontrada.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DivergenciaBearTab;