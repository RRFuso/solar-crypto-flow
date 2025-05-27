
import React, { useState } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  predictions: Prediction[];
  chartTimeframe?: string;
}

interface StrategyData {
  symbol: string;
  name: string;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  risk: string;
  reward: string;
  timeframe: string;
  direction: 'bullish' | 'bearish';
  overview: string;
  indicators: string[];
}

export const AIWatchlist: React.FC<Props> = ({ predictions, chartTimeframe = '4h' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  const filtered = predictions
    .filter(p =>
      p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.confidence - a.confidence);

  const bullish = filtered.filter(p => p.bullish);
  const bearish = filtered.filter(p => !p.bullish);

  const generateIndicators = (p: Prediction): string[] => {
    const indicators: string[] = [];

    if (p.confidence >= 0.85) indicators.push('🔥 Volume Anômalo');
    if (p.factors.some(f => /RSI/i)) indicators.push('RSI Divergência');
    if (p.factors.some(f => /MACD/i)) indicators.push('MACD Cruzamento');
    if (p.factors.some(f => /fibonacci/i)) indicators.push('Fibonacci Retração');
    if (p.factors.some(f => /support|resistance/i)) indicators.push('Suporte/Resistência');

    return indicators.slice(0, 3);
  };

  const showStrategy = (p: Prediction) => {
    const price = parseFloat(p.price || '0') || 1;
    const indicators = generateIndicators(p);

    const stop = 3 + Math.random() * 2;
    const tp1 = 5 + Math.random() * 5;
    const tp2 = tp1 + 5 + Math.random() * 10;

    const direction = p.bullish ? 'bullish' : 'bearish';

    setSelectedStrategy({
      symbol: p.symbol,
      name: p.name || p.symbol,
      entry: price.toFixed(2),
      stopLoss: (p.bullish ? price * (1 - stop / 100) : price * (1 + stop / 100)).toFixed(2),
      takeProfit1: (p.bullish ? price * (1 + tp1 / 100) : price * (1 - tp1 / 100)).toFixed(2),
      takeProfit2: (p.bullish ? price * (1 + tp2 / 100) : price * (1 - tp2 / 100)).toFixed(2),
      risk: `${stop.toFixed(1)}%`,
      reward: `${tp2.toFixed(1)}%`,
      timeframe: chartTimeframe,
      direction,
      overview: `${p.symbol} apresenta sinal ${direction === 'bullish' ? 'de alta' : 'de baixa'} com base em ${indicators.join(', ')}.`,
      indicators,
    });
  };

  const renderPrediction = (p: Prediction) => (
    <div
      key={p.symbol}
      className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-md p-2 flex items-center gap-3"
      style={{ maxWidth: '260px' }}
    >
      <img
        src={getCryptoLogoUrl(p.symbol)}
        alt={p.symbol}
        className="w-6 h-6 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-sm text-white">
          <span className="truncate max-w-[100px]">{p.symbol}</span>
          <span className={p.bullish ? 'text-green-400' : 'text-red-400'}>
            {p.bullish ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.round(p.confidence * 100)}%
          </span>
        </div>
        <div className="text-xs text-gray-400 truncate">{p.factors.slice(0, 2).join(' + ')}</div>
        {p.confidence > 0.6 && (
          <button
            onClick={() => showStrategy(p)}
            className="text-xs text-blue-400 hover:underline mt-1"
          >
            Ver Estratégia
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-black border border-gray-700 rounded-lg px-4 py-3 w-[280px]">
      <h2 className="text-white text-lg font-semibold mb-2">🧠 AI Watchlist</h2>
      <div className="mb-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar ativo..."
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
        />
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[600px]">
        {bullish.length > 0 && (
          <div>
            <h3 className="text-green-400 text-sm mb-1">🐂 Bullish</h3>
            <div className="space-y-2">{bullish.map(renderPrediction)}</div>
          </div>
        )}
        {bearish.length > 0 && (
          <div>
            <h3 className="text-red-400 text-sm mt-4 mb-1">🐻 Bearish</h3>
            <div className="space-y-2">{bearish.map(renderPrediction)}</div>
          </div>
        )}
      </div>

      {selectedStrategy && (
        <Dialog open onOpenChange={() => setSelectedStrategy(null)}>
          <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle>
                Estratégia: {selectedStrategy.name}
              </DialogTitle>
              <DialogDescription>
                Timeframe: {selectedStrategy.timeframe}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 text-sm text-gray-300 space-y-2">
              <p>{selectedStrategy.overview}</p>
              <ul className="list-disc list-inside text-xs text-gray-400">
                {selectedStrategy.indicators.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="text-green-400">Entrada: ${selectedStrategy.entry}</div>
                <div className="text-red-400">Stop: ${selectedStrategy.stopLoss}</div>
                <div className="text-green-400">TP1: ${selectedStrategy.takeProfit1}</div>
                <div className="text-green-400">TP2: ${selectedStrategy.takeProfit2}</div>
                <div className="text-yellow-400">Risco: {selectedStrategy.risk}</div>
                <div className="text-yellow-400">Retorno: {selectedStrategy.reward}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
