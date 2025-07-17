
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface OutperformingTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const OutperformingTab: React.FC<OutperformingTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {
  
  const filteredSignals = signals
    .filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.strengthScore - a.strengthScore); // Ordena pela força relativa

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Força Relativa" 
        subtitle="Ativos com maior força vs. mercado"
      />
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredSignals.map((signal) => (
            <CryptoCard
              key={signal.symbol}
              // Adapta o `UnifiedSignal` para o que o `CryptoCard` espera
              crypto={{ 
                id: signal.symbol, 
                name: signal.name, 
                performance: signal.strengthScore, // Usando strengthScore como performance
                price: parseFloat(signal.prediction.price || '0'),
                change24h: signal.prediction.bullish ? 1 : -1, // Simplificado
                marketCap: 0, // Adicionar se disponível no UnifiedSignal
                volume: 0, // Adicionar se disponível no UnifiedSignal
              }}
              onClick={() => onSelectSignal(signal)}
              isSelected={selectedSignal?.symbol === signal.symbol}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OutperformingTab;
