import React, { useState, useEffect } from 'react';
import { useUnifiedSignalEngine, UnifiedSignal } from '@/hooks/useUnifiedSignalEngine';
import CryptoLogo from './CryptoLogo';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AIWatchlistProps {
  maxItems?: number;
  chartTimeframe?: string;
}

interface Strategy {
    symbol: string;
    name: string;
    direction: 'bullish' | 'bearish';
    entry: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    risk: string;
    reward: string;
    overview: string;
    indicators: string[];
    timeframe: string;
    explosivePotential?: string;
    priceActionSignals?: string[];
}

const AIWatchlist: React.FC<AIWatchlistProps> = ({ maxItems = 5, chartTimeframe = '4h' }) => {
  const [search, setSearch] = useState('');
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  // --- NOVO MOTOR DE SINAL UNIFICADO ---
  const { signals, isLoading, error } = useUnifiedSignalEngine(chartTimeframe);

  const allSignals = signals ? Array.from(signals.values()) : [];

  const filtered = allSignals
    .filter(s =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore);

  const bullish = filtered.filter(s => s.recommendation === 'strong_buy' || s.recommendation === 'buy').slice(0, maxItems);
  const bearish = filtered.filter(s => s.recommendation === 'strong_sell' || s.recommendation === 'sell').slice(0, maxItems);

  const getExplosiveBadge = (potential: string) => {
    if (!potential || potential === 'None') return null;
    const config: { [key: string]: { color: string; icon: string; label: string; } } = {
      'High': { color: 'text-red-400 bg-red-900/30 border-red-400/50', icon: '🚀', label: 'HIGH' },
      'Medium': { color: 'text-orange-400 bg-orange-900/30 border-orange-400/50', icon: '⚡', label: 'MED' },
      'Low': { color: 'text-yellow-400 bg-yellow-900/30 border-yellow-400/50', icon: '📈', label: 'LOW' }
    };
    const badge = config[potential];
    if (!badge) return null;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${badge.color}`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </div>
    );
  };

  const handleShowStrategyClick = (signal: UnifiedSignal) => {
    // A lógica de cálculo da estratégia pode ser movida para o motor unificado no futuro.
    // Por enquanto, vamos gerar uma estratégia simples baseada no sinal.
    const { prediction, priceAction } = signal;
    const currentPrice = parseFloat(prediction.price || '0') || 1;
    const stopLossPrice = prediction.bullish ? currentPrice * 0.97 : currentPrice * 1.03;
    const stopDistance = Math.abs(currentPrice - stopLossPrice);
    const takeProfit1 = prediction.bullish ? currentPrice + stopDistance * 1.5 : currentPrice - stopDistance * 1.5;
    const takeProfit2 = prediction.bullish ? currentPrice + stopDistance * 2.5 : currentPrice - stopDistance * 2.5;

    const priceActionSignals = [];
    if (priceAction.isBreakout) priceActionSignals.push('💥 Volume Breakout');
    if (priceAction.isExpansion) priceActionSignals.push('📊 Volatilidade Expansão');
    if (priceAction.isAccelerating) priceActionSignals.push('🚀 Momentum Aceleração');

    setStrategy({
        symbol: signal.symbol,
        name: signal.name,
        direction: prediction.bullish ? 'bullish' : 'bearish',
        entry: currentPrice.toFixed(4),
        stopLoss: stopLossPrice.toFixed(4),
        takeProfit1: takeProfit1.toFixed(4),
        takeProfit2: takeProfit2.toFixed(4),
        risk: '3%', // Simplificado
        reward: '7.5%', // Simplificado
        overview: `Sinal ${signal.recommendation.replace('_', ' ')} com confiança de ${Math.round(signal.confidence * 100)}%. Pontuação geral: ${signal.overallScore.toFixed(0)}.`,
        indicators: prediction.factors,
        timeframe: chartTimeframe,
        explosivePotential: priceAction.explosivePotential,
        priceActionSignals,
    });
  };

  const renderCard = (signal: UnifiedSignal) => {
    const isBullish = signal.recommendation === 'strong_buy' || signal.recommendation === 'buy';

    return (
      <div key={signal.symbol} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-white border border-gray-700">
        <div className="flex items-start gap-3">
          <CryptoLogo symbol={signal.symbol} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm truncate">{signal.symbol}</span>
                {getExplosiveBadge(signal.priceAction.explosivePotential)}
              </div>
              <div className={`flex items-center gap-1 ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                {isBullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="text-xs font-medium">{Math.round(signal.confidence * 100)}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-2 line-clamp-2">{signal.prediction.factors[0]}</div>
            <button onClick={() => handleShowStrategyClick(signal)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors">
              Ver Estratégia
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
        <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full p-3 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading signals: {error.message}</div>;
  }

  return (
    <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col w-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-white text-base font-semibold mb-2">🧠 AI Watchlist</h2>
        <input
          className="w-full p-1.5 rounded-md bg-gray-900 border border-gray-600 text-white text-sm"
          placeholder="🔍 Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <h3 className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1.5"><ArrowUpRight size={14} /> Bullish Signals</h3>
            <div className="space-y-1.5">
              {bullish.length > 0 ? bullish.map(renderCard) : <div className="text-gray-500 text-xs text-center py-3">Nenhum sinal bullish.</div>}
            </div>
          </div>
          <div>
            <h3 className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1.5"><ArrowDownRight size={14} /> Bearish Signals</h3>
            <div className="space-y-1.5">
              {bearish.length > 0 ? bearish.map(renderCard) : <div className="text-gray-500 text-xs text-center py-3">Nenhum sinal bearish.</div>}
            </div>
          </div>
        </div>
      </div>

      {strategy && (
        <Dialog open={!!strategy} onOpenChange={() => setStrategy(null)}>
          <DialogContent className="bg-gray-900 border border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>{strategy.name} ({strategy.symbol})</DialogTitle>
              <DialogDescription>{strategy.overview}</DialogDescription>
            </DialogHeader>
            {/* O conteúdo do Dialog pode ser preenchido com os detalhes da estratégia */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AIWatchlist;