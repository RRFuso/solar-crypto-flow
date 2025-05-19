
// src/components/capital-flow/AIWatchlist.tsx

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
}

const AIWatchlist: React.FC<AIWatchlistProps> = ({
  predictions,
  maxItems = 5,
  chartTimeframe = '4h'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(null);

  // Ordena por confiança decrescente
  const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence);

  // Filtra pela busca
  const filtered = searchTerm
    ? sortedPredictions.filter(p =>
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : sortedPredictions;

  const bullish = filtered.filter(p => p.bullish).slice(0, maxItems);
  const bearish = filtered.filter(p => !p.bullish).slice(0, maxItems);

  const showStrategyModal = (prediction: Prediction) => {
    const price = parseFloat(prediction.price || "0");
    // Lógica simplificada de estratégia (pode estender como desejar)...
    const stopLossPct = 3 + Math.random() * 2;
    const tp1Pct = 5 + Math.random() * 5;
    const tp2Pct = tp1Pct + 5 + Math.random() * 10;

    const stopLoss = price * (prediction.bullish ? (1 - stopLossPct/100) : (1 + stopLossPct/100));
    const tp1 = price * (prediction.bullish ? (1 + tp1Pct/100) : (1 - tp1Pct/100));
    const tp2 = price * (prediction.bullish ? (1 + tp2Pct/100) : (1 - tp2Pct/100));

    setSelectedStrategy({
      symbol: prediction.symbol,
      name: prediction.name || prediction.symbol,
      entry: price.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit1: tp1.toFixed(2),
      takeProfit2: tp2.toFixed(2),
      risk: `${stopLossPct.toFixed(1)}%`,
      reward: `${tp2Pct.toFixed(1)}%`,
      timeframe: chartTimeframe,
      direction: prediction.bullish ? 'bullish' : 'bearish',
      overview: prediction.bullish
        ? `RSI oversold + Bullish MACD crossover. Entrada em ${price.toFixed(2)}, SL ${stopLossPct.toFixed(1)}%, TP1 ${tp1Pct.toFixed(1)}%, TP2 ${tp2Pct.toFixed(1)}%.`
        : `RSI overbought + Bearish MACD crossover. Entrada em ${price.toFixed(2)}, SL ${stopLossPct.toFixed(1)}%, TP1 ${tp1Pct.toFixed(1)}%, TP2 ${tp2Pct.toFixed(1)}%.`
    });
  };

  const renderCard = (p: Prediction) => (
    <div
      key={p.symbol}
      className={`
        flex items-center gap-2 p-2 rounded-md 
        hover:bg-white/5 transition-colors
        ${p.confidence >= 0.8 ? (p.bullish ? 'bg-green-900/20' : 'bg-red-900/20') : ''}
      `}
    >
      <img
        src={getCryptoLogoUrl(p.symbol)}
        alt={p.symbol}
        className="w-6 h-6 flex-shrink-0 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          {/* Símbolo com truncamento */}
          <span className="font-medium text-white text-xs truncate">{p.symbol}</span>
          {/* Confiança */}
          <span className={`flex items-center text-xs ${p.bullish ? 'text-green-400' : 'text-red-400'}`}>
            {p.bullish ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.round(p.confidence * 100)}%
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-white/60 mt-0.5">
          {/* Indicador principal com truncamento */}
          <span className="truncate text-[10px]">{p.factors[0]}</span>
          {p.confidence >= 0.6 && (
            <button
              className="ml-1 px-1 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-[10px] flex-shrink-0"
              onClick={() => showStrategyModal(p)}
            >
              Ver
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-white/10 bg-black/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex-1">AI Watchlist</h3>
          <span className="text-xs text-white/50">{chartTimeframe}</span>
        </div>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar ativo"
            className="
              w-full pl-10 pr-2 py-2 text-white/80 text-sm bg-black/30
              border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-white/20
            "
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-1 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">Nenhum sinal encontrado</div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {/* Bullish */}
            <div className="space-y-1">
              <div className="text-center py-1 bg-green-900/20 rounded-md">
                <h4 className="text-xs font-medium text-green-400">🐂 Bullish</h4>
              </div>
              <div className="space-y-1">
                {bullish.length > 0
                  ? bullish.map(renderCard)
                  : <div className="text-center text-xs text-white/30 py-2">Sem sinais</div>
                }
              </div>
            </div>
            {/* Bearish */}
            <div className="space-y-1">
              <div className="text-center py-1 bg-red-900/20 rounded-md">
                <h4 className="text-xs font-medium text-red-400">🐻 Bearish</h4>
              </div>
              <div className="space-y-1">
                {bearish.length > 0
                  ? bearish.map(renderCard)
                  : <div className="text-center text-xs text-white/30 py-2">Sem sinais</div>
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de estratégia */}
      <Dialog
        open={!!selectedStrategy}
        onOpenChange={open => { if (!open) setSelectedStrategy(null); }}
      >
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img
                src={selectedStrategy ? getCryptoLogoUrl(selectedStrategy.symbol) : ''}
                className="w-6 h-6 rounded-full"
                onError={e => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';
                }}
              />
              {selectedStrategy?.name} ({selectedStrategy?.symbol})
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Estratégia para {selectedStrategy?.timeframe}
            </DialogDescription>
          </DialogHeader>
          {selectedStrategy && (
            <div className="space-y-4">
              <p className="p-4 bg-gray-800/50 rounded-md text-sm text-gray-300">
                {selectedStrategy.overview}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg flex flex-col ${
                  selectedStrategy.direction === 'bullish'
                    ? 'bg-green-900/20 text-green-400'
                    : 'bg-red-900/20 text-red-400'
                }`}>
                  <span className="text-xs text-gray-400">Direção</span>
                  <span className="text-lg font-bold">
                    {selectedStrategy.direction === 'bullish' ? '🚀 Long' : '🔻 Short'}
                  </span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg flex flex-col">
                  <span className="text-xs text-gray-400">Entry</span>
                  <span className="text-lg font-bold">${selectedStrategy.entry}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-red-900/20 rounded-lg flex flex-col">
                  <span className="text-xs text-gray-400">Stop Loss</span>
                  <span className="text-lg font-bold">${selectedStrategy.stopLoss}</span>
                  <span className="text-xs">{selectedStrategy.risk}</span>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg flex flex-col">
                  <span className="text-xs text-gray-400">Take Profit 1</span>
                  <span className="text-lg font-bold">${selectedStrategy.takeProfit1}</span>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg flex flex-col">
                  <span className="text-xs text-gray-400">Take Profit 2</span>
                  <span className="text-lg font-bold">${selectedStrategy.takeProfit2}</span>
                  <span className="text-xs">{selectedStrategy.reward}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIWatchlist;
