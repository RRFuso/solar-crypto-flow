import React, { useState } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
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

const AIWatchlist: React.FC<AIWatchlistProps> = ({
  predictions,
  maxItems = 5,
  chartTimeframe = '4h'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  const scorePrediction = (p: Prediction): number => {
    let score = p.confidence * 100;

    if (p.factors.some(f => /volume.+outflow/i)) score += 15;
    if (p.factors.some(f => /volume.+inflow/i)) score += 20;
    if (p.factors.some(f => /RSI.+diverg/i)) score += 20;
    if (p.factors.some(f => /MACD.+cross/i)) score += 10;
    if (p.factors.some(f => /support|resistance/i)) score += 10;
    if (p.factors.some(f => /fibonacci/i)) score += 10;

    return score;
  };

  const generateIndicators = (p: Prediction): string[] => {
    const list: string[] = [];

    if (p.factors.some(f => /volume inflow/i)) list.push("Inflow de Capital");
    if (p.factors.some(f => /volume outflow/i)) list.push("Outflow de Capital");
    if (p.factors.some(f => /RSI.*diverg/i)) list.push("Divergência RSI");
    if (p.factors.some(f => /RSI.*(30|70)/i)) list.push("RSI Extremo");
    if (p.factors.some(f => /MACD/i)) list.push("MACD Cruzamento");
    if (p.factors.some(f => /fibonacci/i)) list.push("Fibonacci");
    if (p.factors.some(f => /support|resistance/i)) list.push("Suporte/Resistência");

    return list.length ? list : ['Análise Combinada'];
  };

  const showStrategy = (p: Prediction) => {
    const price = parseFloat(p.price || "0") || 1;
    const direction = p.bullish ? 'bullish' : 'bearish';
    const stopPercent = 3 + Math.random() * 2;
    const tp1 = 6 + Math.random() * 4;
    const tp2 = tp1 + 5 + Math.random() * 10;

    const stopLoss = direction === 'bullish'
      ? price * (1 - stopPercent / 100)
      : price * (1 + stopPercent / 100);

    const takeProfit1 = direction === 'bullish'
      ? price * (1 + tp1 / 100)
      : price * (1 - tp1 / 100);

    const takeProfit2 = direction === 'bullish'
      ? price * (1 + tp2 / 100)
      : price * (1 - tp2 / 100);

    const indicators = generateIndicators(p);

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
      overview: `${p.symbol} apresenta cenário ${direction === 'bullish' ? 'positivo' : 'negativo'} com base em: ${indicators.join(', ')}. Entrada sugerida em $${price.toFixed(2)}, com stop de ${stopPercent.toFixed(1)}% e alvos de ${tp1.toFixed(1)}% e ${tp2.toFixed(1)}%.`,
      indicators
    });
  };

  const sorted = [...predictions]
    .sort((a, b) => scorePrediction(b) - scorePrediction(a));

  const filtered = searchTerm
    ? sorted.filter(p =>
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sorted;

  const bullish = filtered.filter(p => p.bullish).slice(0, maxItems);
  const bearish = filtered.filter(p => !p.bullish).slice(0, maxItems);

  const renderCard = (p: Prediction) => (
    <div key={p.symbol} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-2">
        <img src={getCryptoLogoUrl(p.symbol)} alt={p.symbol} className="w-6 h-6 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between text-sm text-white">
            <span>{p.symbol}</span>
            <span className={p.bullish ? 'text-green-400' : 'text-red-400'}>
              {p.bullish ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.round(scorePrediction(p))}%
            </span>
          </div>
          <div className="text-xs text-gray-400 truncate">{p.factors[0]}</div>
        </div>
        <button onClick={() => showStrategy(p)} className="text-blue-400 text-xs hover:underline">
          Ver Estratégia
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-black border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-white text-lg font-semibold mb-3">📈 AI Watchlist</h2>
      <div className="mb-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar ativo"
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-1">
        <div>
          <h3 className="text-green-400 text-sm mb-2">🐂 Bullish</h3>
          <div className="space-y-2">
            {bullish.length ? bullish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
          </div>
        </div>
        <div>
          <h3 className="text-red-400 text-sm mb-2">🐻 Bearish</h3>
          <div className="space-y-2">
            {bearish.length ? bearish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
          </div>
        </div>
      </div>

      {selectedStrategy && (
        <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Estratégia: {selectedStrategy.name} ({selectedStrategy.symbol})
              </DialogTitle>
              <DialogDescription>
                Timeframe: {selectedStrategy.timeframe}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>{selectedStrategy.overview}</p>
              <ul className="list-disc list-inside text-xs text-gray-400">
                {selectedStrategy.indicators.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="text-green-300">Entrada: ${selectedStrategy.entry}</div>
                <div className="text-red-300">Stop: ${selectedStrategy.stopLoss}</div>
                <div className="text-green-300">TP1: ${selectedStrategy.takeProfit1}</div>
                <div className="text-green-300">TP2: ${selectedStrategy.takeProfit2}</div>
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

export default AIWatchlist;
