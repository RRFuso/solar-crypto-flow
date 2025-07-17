
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import CryptoCard from '@/components/CryptoCard';
import { ColumnHeader } from '../ColumnHeader';
import { UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';

interface ExplosiveTabProps {
  signals: UnifiedSignal[];
  selectedSignal: UnifiedSignal | null;
  onSelectSignal: (signal: UnifiedSignal) => void;
  searchTerm: string;
}

const ExplosiveTab: React.FC<ExplosiveTabProps> = ({ signals, selectedSignal, onSelectSignal, searchTerm }) => {

  const explosiveOrder = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 };

  const explosiveSignals = signals
    .filter(s => 
        s.priceAction.explosivePotential && 
        s.priceAction.explosivePotential !== 'None' &&
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aExplosive = explosiveOrder[a.priceAction.explosivePotential || 'None'];
      const bExplosive = explosiveOrder[b.priceAction.explosivePotential || 'None'];
      if (aExplosive !== bExplosive) return bExplosive - aExplosive;
      return b.overallScore - a.overallScore; // Fallback to overallScore
    });

  return (
    <div className="h-full flex flex-col">
      <ColumnHeader 
        title="Potencial Explosivo" 
        subtitle="Ativos com alta probabilidade de movimentos significativos" 
      />
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {explosiveSignals.length > 0 ? (
            explosiveSignals.map((signal) => (
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
            <div className="text-center text-gray-400">Nenhum ativo com potencial explosivo encontrado.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExplosiveTab;
