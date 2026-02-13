import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FlowToken {
  symbol: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  size: number;
}

interface FlowData {
  title: string;
  tokens: FlowToken[];
}

const formatUSD = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const DirectionIcon = ({ direction }: { direction: string }) => {
  if (direction === 'bullish') return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (direction === 'bearish') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
};

const InlineFlowVisualization: React.FC<{ data: FlowData }> = ({ data }) => {
  const sortedTokens = useMemo(
    () => [...data.tokens].sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow)),
    [data.tokens]
  );

  const maxFlow = useMemo(
    () => Math.max(...sortedTokens.map(t => Math.max(t.inflow, t.outflow)), 1),
    [sortedTokens]
  );

  return (
    <div className="my-3 rounded-lg border border-gray-700/50 bg-gray-900/80 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700/50 bg-gradient-to-r from-amber-900/20 to-purple-900/20">
        <h4 className="text-xs font-semibold text-amber-300">☀️ {data.title}</h4>
      </div>

      {/* Mini Solar System */}
      <div className="relative p-4 flex items-center justify-center min-h-[140px]">
        {/* Central sun */}
        <div className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/40 z-10 flex items-center justify-center">
          <span className="text-[8px] font-bold text-black">☀️</span>
        </div>

        {/* Orbiting tokens */}
        {sortedTokens.map((token, i) => {
          const angle = (i / sortedTokens.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 45 + i * 14;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const planetSize = 10 + token.size * 16;
          const isGold = token.confidence > 70;
          const dirColor = token.direction === 'bullish' ? 'from-green-400 to-emerald-600' 
                         : token.direction === 'bearish' ? 'from-red-400 to-red-600' 
                         : 'from-gray-400 to-gray-600';

          return (
            <div
              key={token.symbol}
              className="absolute flex flex-col items-center gap-0.5"
              style={{
                left: `calc(50% + ${x}px - ${planetSize / 2}px)`,
                top: `calc(50% + ${y}px - ${planetSize / 2}px)`,
              }}
            >
              <div
                className={`rounded-full bg-gradient-to-br ${dirColor} flex items-center justify-center relative`}
                style={{ width: planetSize, height: planetSize }}
              >
                {isGold && (
                  <div
                    className="absolute inset-[-3px] rounded-full border-2 border-amber-400/70 animate-pulse"
                  />
                )}
                <span className="text-[7px] font-bold text-white drop-shadow-md">
                  {token.symbol.slice(0, 3)}
                </span>
              </div>
              <span className="text-[8px] text-gray-400 whitespace-nowrap">{token.symbol}</span>
            </div>
          );
        })}
      </div>

      {/* Flow bars */}
      <div className="px-3 pb-3 space-y-1.5">
        {sortedTokens.map(token => {
          const inflowWidth = (token.inflow / maxFlow) * 100;
          const outflowWidth = (token.outflow / maxFlow) * 100;

          return (
            <div key={token.symbol} className="flex items-center gap-2 text-[10px]">
              <div className="w-10 text-right font-mono text-gray-300 flex items-center gap-1 justify-end">
                <DirectionIcon direction={token.direction} />
                {token.symbol}
              </div>
              <div className="flex-1 flex gap-0.5 items-center">
                {/* Inflow bar */}
                <div className="flex-1 h-3 bg-gray-800 rounded-sm overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-sm transition-all duration-500"
                    style={{ width: `${inflowWidth}%` }}
                  />
                  {inflowWidth > 20 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/80">
                      {formatUSD(token.inflow)}
                    </span>
                  )}
                </div>
                {/* Outflow bar */}
                <div className="flex-1 h-3 bg-gray-800 rounded-sm overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-sm transition-all duration-500"
                    style={{ width: `${outflowWidth}%` }}
                  />
                  {outflowWidth > 20 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/80">
                      {formatUSD(token.outflow)}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-12 text-right font-mono ${
                token.netFlow > 0 ? 'text-green-400' : token.netFlow < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {token.netFlow > 0 ? '+' : ''}{formatUSD(token.netFlow)}
              </div>
              {token.confidence > 70 && (
                <span className="text-amber-400 text-[8px]">👑</span>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-700/30 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-green-500" />
            <span className="text-[9px] text-gray-500">Inflow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-red-500" />
            <span className="text-[9px] text-gray-500">Outflow</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-amber-400">👑</span>
            <span className="text-[9px] text-gray-500">Confiança &gt;70</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineFlowVisualization;
