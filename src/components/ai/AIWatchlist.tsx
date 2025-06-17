
import React, { useState } from 'react';
import { Prediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { normalizeFeatures } from '@/lib/featureExtractor';
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
      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors text-white border border-gray-700"
    >
      <div className="flex items-start gap-3">
        <img
          src={getCryptoLogoUrl(p.symbol)}
          alt={p.symbol}
          className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm truncate">{p.symbol}</span>
            <div className={`flex items-center gap-1 ${p.bullish ? 'text-green-400' : 'text-red-400'}`}>
              {p.bullish ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span className="text-xs font-medium">{Math.round(p.confidence * 100)}%</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-2 line-clamp-2">{p.factors[0]}</div>
          {p.confidence > 0.6 && (
            <button
              onClick={() => showStrategy(p)}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              Ver Estratégia
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-black border border-gray-700 rounded-lg h-full flex flex-col min-w-[380px] max-w-[450px]">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
          🧠 AI Watchlist
        </h2>
        <input
          className="w-full p-2 rounded-md bg-gray-900 border border-gray-600 text-white text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          placeholder="🔍 Buscar ativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-green-400 text-sm font-medium mb-3 flex items-center gap-2">
              🐂 Bullish Signals
            </h3>
            <div className="space-y-2">
              {bullish.length ? (
                bullish.map(renderCard)
              ) : (
                <div className="text-gray-500 text-xs text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  Nenhum sinal bullish disponível
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-red-400 text-sm font-medium mb-3 flex items-center gap-2">
              🐻 Bearish Signals
            </h3>
            <div className="space-y-2">
              {bearish.length ? (
                bearish.map(renderCard)
              ) : (
                <div className="text-gray-500 text-xs text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  Nenhum sinal bearish disponível
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Dialog */}
      {strategy && (
        <Dialog open={!!strategy} onOpenChange={() => setStrategy(null)}>
          <DialogContent className="bg-gray-900 border border-gray-700 max-w-lg w-full text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-center">
                Estratégia: {strategy.name} ({strategy.symbol})
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400">
                Baseada no timeframe {strategy.timeframe}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-300">{strategy.overview}</p>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-400">Indicadores Técnicos:</h4>
                <ul className="space-y-1">
                  {strategy.indicators.map((indicator, idx) => (
                    <li key={idx} className="text-xs text-gray-400">• {indicator}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/50">
                  <div className="text-green-400 text-xs font-medium">📥 Entrada</div>
                  <div className="text-white font-bold">${strategy.entry}</div>
                </div>
                <div className="bg-red-900/30 p-3 rounded-lg border border-red-700/50">
                  <div className="text-red-400 text-xs font-medium">🛑 Stop Loss</div>
                  <div className="text-white font-bold">${strategy.stopLoss}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-600/50">
                  <div className="text-green-300 text-xs font-medium">🎯 Take Profit 1</div>
                  <div className="text-white font-bold">${strategy.takeProfit1}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-600/50">
                  <div className="text-green-300 text-xs font-medium">🎯 Take Profit 2</div>
                  <div className="text-white font-bold">${strategy.takeProfit2}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-900/30 p-2 rounded-lg border border-yellow-700/50 text-center">
                  <div className="text-yellow-300 text-xs">⚠️ Risco</div>
                  <div className="text-white font-bold text-sm">{strategy.risk}</div>
                </div>
                <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-700/50 text-center">
                  <div className="text-blue-300 text-xs">📈 Retorno</div>
                  <div className="text-white font-bold text-sm">{strategy.reward}</div>
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
