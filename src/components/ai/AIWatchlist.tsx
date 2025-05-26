
import React, { useState } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AIWatchlistProps {
  predictions: Prediction[];
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
}

const AIWatchlist: React.FC<AIWatchlistProps> = ({
  predictions,
  maxItems = 5,
  chartTimeframe = '4h',
}) => {
  const [search, setSearch] = useState('');
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  const filtered = predictions
    .filter(p =>
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.confidence - a.confidence);

  const bullish = filtered.filter(p => p.bullish).slice(0, maxItems);
  const bearish = filtered.filter(p => !p.bullish).slice(0, maxItems);

  const indicatorsFromFactors = (p: Prediction): string[] => {
    const result: string[] = [];
    const lowerFactors = p.factors.map(f => f.toLowerCase());
    if (lowerFactors.some(f => f.includes('rsi'))) result.push('🔁 RSI Divergência');
    if (lowerFactors.some(f => f.includes('macd'))) result.push('📊 MACD Cruzamento');
    if (lowerFactors.some(f => f.includes('volume'))) result.push('💥 Volume Anômalo');
    if (lowerFactors.some(f => f.includes('flow') || f.includes('inflow') || f.includes('outflow'))) result.push('🌊 Fluxo de Capital');
    if (lowerFactors.some(f => f.includes('support') || f.includes('resistance'))) result.push('🧱 Suporte/Resistência');
    return result.length > 0 ? result : ['📈 Análise Técnica'];
  };

  const showStrategy = (p: Prediction) => {
    const price = parseFloat(p.price || '0') || 1;
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

    const indicators = indicatorsFromFactors(p);
    const overview = `${p.symbol} apresenta potencial ${
      p.bullish ? 'bullish' : 'bearish'
    } com base em ${indicators.join(', ')}. Entrada sugerida em $${price.toFixed(
      2
    )}, risco de ${stopPercent.toFixed(
      1
    )}% e retorno estimado até ${tp2.toFixed(1)}%.`;

    setStrategy({
      symbol: p.symbol,
      name: p.name || p.symbol,
      direction,
      entry: price.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit1: takeProfit1.toFixed(2),
      takeProfit2: takeProfit2.toFixed(2),
      risk: `${stopPercent.toFixed(1)}%`,
      reward: `${tp2.toFixed(1)}%`,
      overview,
      indicators,
      timeframe: chartTimeframe,
    });
  };

  const renderCard = (p: Prediction) => (
    <div
      key={p.symbol}
      className="bg-gray-800 rounded-md p-3 hover:bg-gray-700 transition text-white text-sm flex flex-col gap-1"
    >
      <div className="flex items-center gap-2">
        <img
          src={getCryptoLogoUrl(p.symbol)}
          alt={p.symbol}
          className="w-6 h-6 rounded-full"
        />
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="font-bold">{p.symbol}</span>
            <span className={p.bullish ? 'text-green-400' : 'text-red-400'}>
              {p.bullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.round(p.confidence * 100)}%
            </span>
          </div>
          <div className="text-xs text-gray-400 truncate">{p.factors[0]}</div>
        </div>
      </div>
      {p.confidence > 0.6 && (
        <button
          onClick={() => showStrategy(p)}
          className="text-xs text-blue-400 mt-1 hover:underline self-end"
        >
          Ver Estratégia
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-black border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-white text-lg font-semibold mb-3">🧠 AI Watchlist</h2>

      <input
        className="mb-3 p-2 w-full rounded-md bg-gray-900 border border-gray-700 text-white text-sm"
        placeholder="🔍 Buscar ativo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto flex-1">
        <div>
          <h3 className="text-green-400 text-sm mb-1">🐂 Bullish</h3>
          <div className="space-y-2">
            {bullish.length ? bullish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
          </div>
        </div>
        <div>
          <h3 className="text-red-400 text-sm mb-1">🐻 Bearish</h3>
          <div className="space-y-2">
            {bearish.length ? bearish.map(renderCard) : <p className="text-gray-500 text-xs">Nenhum sinal</p>}
          </div>
        </div>
      </div>

      {/* Strategy Dialog */}
      {strategy && (
        <Dialog open={!!strategy} onOpenChange={() => setStrategy(null)}>
          <DialogContent className="bg-gray-900 border border-gray-700 max-w-md w-full text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Estratégia: {strategy.name} ({strategy.symbol})
              </DialogTitle>
              <DialogDescription>
                Baseada no timeframe {strategy.timeframe}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3 text-sm">
              <p>{strategy.overview}</p>
              <ul className="list-disc list-inside text-xs text-gray-400">
                {strategy.indicators.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="text-green-400">📥 Entrada: ${strategy.entry}</div>
                <div className="text-red-400">🛑 Stop: ${strategy.stopLoss}</div>
                <div className="text-green-300">🎯 TP1: ${strategy.takeProfit1}</div>
                <div className="text-green-300">🎯 TP2: ${strategy.takeProfit2}</div>
                <div className="text-yellow-300">⚠️ Risco: {strategy.risk}</div>
                <div className="text-yellow-300">📈 Retorno: {strategy.reward}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AIWatchlist;
