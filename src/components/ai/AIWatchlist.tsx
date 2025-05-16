import React, { useState } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIWatchlistProps {
  predictions: Prediction[];
  maxItems?: number;
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

const AIWatchlist: React.FC<AIWatchlistProps> = ({ predictions, maxItems = 5, chartTimeframe = '4h' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);

  const filtered = searchTerm
    ? sorted.filter(p =>
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sorted;

  const bullish = filtered.filter(p => p.bullish).slice(0, maxItems);
  const bearish = filtered.filter(p => !p.bullish).slice(0, maxItems);

  const generateIndicators = (p: Prediction): string[] => {
    const indicators: string[] = [];

    if (p.confidence >= 0.85) indicators.push('🔥 Volume Anômalo');
    if (p.factors.some(f => /RSI/i.test(f))) indicators.push('RSI Divergência');
    if (p.factors.some(f => /MACD/i.test(f))) indicators.push('MACD Cruzamento');
    if (p.factors.some(f => /fibonacci/i)) indicators.push('Fibonacci Retração');
    if (p.factors.some(f => /support|resistance/i)) indicators.push('Nível de Suporte/Resistência');

    return indicators.length ? indicators : ['Análise Preditiva'];
  };

  const showStrategy = (p: Prediction) => {
    const price = parseFloat(p.price || "0") || 1;
    const indicators = generateIndicators(p);

    const stopPercent = 3 + Math.random() * 2;
    const tp1 = 5 + Math.random() * 5;
    const tp2 = tp1 + 5 + Math.random() * 10;

    const direction = p.bullish ? 'bullish' : 'bearish';
    const stopLoss = p.bullish
      ? price * (1 - stopPercent / 100)
      : price * (1 + stopPercent / 100);
    const takeProfit1 = p.bullish
      ? price * (1 + tp1 / 100)
      : price * (1 - tp1 / 100);
    const takeProfit2 = p.bullish
      ? price * (1 + tp2 / 100)
      : price * (1 - tp2 / 100);

    const overview = `${p.symbol} apresenta sinal ${direction === 'bullish' ? 'de alta' : 'de baixa'} com base em ${indicators.join(', ')}. Entrada sugerida em $${price.toFixed(2)} com stop de ${stopPercent.toFixed(1)}% e alvos de ${tp1.toFixed(1)}% e ${tp2.toFixed(1)}%.`;

    setSelectedStrategy({
      symbol: p.symbol,
      name: p.name || p.symbol,
      entry: price.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit1: takeProfit1.toFixed(2),
      takeProfit2: takeProfit2.toFixed(2),
      risk: `${stopPercent.toFixed(1)}%`,
      reward: `${tp2.toFixed(1)}%`,
      timeframe: chartTimeframe,
      direction,
      overview,
      indicators,
    });
  };

  const renderCard = (p: Prediction) => (
    <div key={p.symbol} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-2">
        <img
          src={getCryptoLogoUrl(p.symbol)}
          alt={p.symbol}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex-1">
          <div className="flex justify-between text-sm text-white">
            <span>{p.symbol}</span>
            <span className={p.bullish ? 'text-green-400' : 'text-red-400'}>
              {p.bullish ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.round(p.confidence * 100)}%
            </span>
          </div>
          <div className="text-xs text-gray-400 truncate">{p.factors[0]}</div>
        </div>
        {p.confidence >= 0.6 && (
          <button onClick={() => showStrategy(p)} className="text-blue-400 text-xs hover:underline">
            Ver Estratégia
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-black border border-gray-700 rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-white text-lg font-semibold">📈 AI Watchlist</h2>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar ativo"
          className="mt-2 w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-green-400 text-sm mb-2">🐂 Bullish</h3>
          {bullish.length ? bullish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
        </div>
        <div>
          <h3 className="text-red-400 text-sm mb-2">🐻 Bearish</h3>
          {bearish.length ? bearish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
        </div>
      </div>

      {selectedStrategy && (
        <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>
                Estratégia: {selectedStrategy.name} ({selectedStrategy.symbol})
              </DialogTitle>
              <DialogDescription>
                Baseado em {selectedStrategy.timeframe} timeframe
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-300">{selectedStrategy.overview}</p>
              <ul className="list-disc list-inside text-xs text-gray-400">
                {selectedStrategy.indicators.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-green-400 text-sm">
                  Entrada: <span className="font-mono">${selectedStrategy.entry}</span>
                </div>
                <div className="text-red-400 text-sm">
                  Stop: <span className="font-mono">${selectedStrategy.stopLoss}</span>
                </div>
                <div className="text-green-300 text-sm">
                  TP1: <span className="font-mono">${selectedStrategy.takeProfit1}</span>
                </div>
                <div className="text-green-300 text-sm">
                  TP2: <span className="font-mono">${selectedStrategy.takeProfit2}</span>
                </div>
                <div className="text-yellow-400 text-xs">
                  Risco: {selectedStrategy.risk}
                </div>
                <div className="text-yellow-400 text-xs">
                  Retorno: {selectedStrategy.reward}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AIWatchlist;
