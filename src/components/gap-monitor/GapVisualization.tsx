import React from 'react';
import { GapAnalysis } from '@/types/cmeGaps';

interface GapVisualizationProps {
  gaps: GapAnalysis[];
  currentPrice: number;
}

export const GapVisualization: React.FC<GapVisualizationProps> = ({ gaps, currentPrice }) => {
  const openGaps = gaps.filter(g => !g.gap.filled);
  
  if (openGaps.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
        <p className="text-muted-foreground">Todos os gaps foram preenchidos!</p>
      </div>
    );
  }

  // Calculate price range for visualization
  const allPrices = openGaps.flatMap(g => [g.gap.gapLow, g.gap.gapHigh]);
  allPrices.push(currentPrice);
  const minPrice = Math.min(...allPrices) * 0.95;
  const maxPrice = Math.max(...allPrices) * 1.05;
  const priceRange = maxPrice - minPrice;

  const getPositionPercent = (price: number) => {
    return ((price - minPrice) / priceRange) * 100;
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return { bg: 'rgba(34, 197, 94, 0.3)', border: 'rgb(34, 197, 94)' };
    if (prob >= 50) return { bg: 'rgba(234, 179, 8, 0.3)', border: 'rgb(234, 179, 8)' };
    return { bg: 'rgba(239, 68, 68, 0.3)', border: 'rgb(239, 68, 68)' };
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Distribuição de Gaps</span>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/30 border border-green-500" />
            Alta prob.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500" />
            Média prob.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
            Baixa prob.
          </span>
        </div>
      </div>

      <div className="relative h-32 bg-crypto-dark/50 rounded-lg overflow-hidden">
        {/* Price axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-2 text-xs text-muted-foreground font-mono">
          <span>${(maxPrice / 1000).toFixed(0)}k</span>
          <span>${((maxPrice + minPrice) / 2 / 1000).toFixed(0)}k</span>
          <span>${(minPrice / 1000).toFixed(0)}k</span>
        </div>

        {/* Visualization area */}
        <div className="absolute left-16 right-0 top-0 bottom-0">
          {/* Gap bars */}
          {openGaps.map((analysis, index) => {
            const colors = getProbabilityColor(analysis.fillProbability);
            const bottomPercent = getPositionPercent(analysis.gap.gapLow);
            const topPercent = getPositionPercent(analysis.gap.gapHigh);
            const heightPercent = topPercent - bottomPercent;
            
            // Spread gaps horizontally
            const leftOffset = 10 + (index * (70 / openGaps.length));
            const width = Math.max(15, 60 / openGaps.length);

            return (
              <div
                key={analysis.gap.id}
                className="absolute transition-all duration-300 hover:opacity-100 opacity-80 cursor-pointer group"
                style={{
                  bottom: `${bottomPercent}%`,
                  height: `${heightPercent}%`,
                  left: `${leftOffset}%`,
                  width: `${width}%`,
                  minHeight: '8px',
                }}
              >
                <div
                  className="absolute inset-0 rounded-sm border-2"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-10">
                  <div className="bg-crypto-dark border border-white/20 rounded-lg p-2 shadow-xl whitespace-nowrap">
                    <p className="text-xs font-semibold text-foreground">
                      ${analysis.gap.gapLow.toLocaleString()} - ${analysis.gap.gapHigh.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Prob: {analysis.fillProbability}%
                    </p>
                  </div>
                </div>
                {/* Probability label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: colors.border }}
                  >
                    {analysis.fillProbability}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current price line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-orange-400 z-10"
            style={{ bottom: `${getPositionPercent(currentPrice)}%` }}
          >
            <span className="absolute right-0 -top-3 text-xs font-bold text-orange-400 bg-crypto-dark px-1 rounded">
              ${currentPrice.toLocaleString()}
            </span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapVisualization;
