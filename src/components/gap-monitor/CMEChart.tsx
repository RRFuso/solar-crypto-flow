import React from 'react';
import { Info } from 'lucide-react';

interface CMEChartProps {
  height?: number;
  gaps?: Array<{
    gapLow: number;
    gapHigh: number;
    type: 'bullish' | 'bearish';
    filled: boolean;
    createdAt: Date;
  }>;
  currentPrice?: number;
}

export const CMEChart: React.FC<CMEChartProps> = ({ 
  height = 400, 
  gaps = [],
  currentPrice = 87500 
}) => {
  // Default gaps if none provided
  const displayGaps = gaps.length > 0 ? gaps : [
    { gapLow: 95200, gapHigh: 96800, type: 'bearish' as const, filled: false, createdAt: new Date('2024-12-01') },
    { gapLow: 97500, gapHigh: 99100, type: 'bullish' as const, filled: false, createdAt: new Date('2024-11-24') },
    { gapLow: 76800, gapHigh: 81200, type: 'bullish' as const, filled: false, createdAt: new Date('2024-11-10') },
  ];

  // Determine gap direction based on current price position
  const getGapDirection = (gapLow: number, gapHigh: number): 'bullish' | 'bearish' => {
    if (currentPrice < gapLow) {
      return 'bullish';
    } else if (currentPrice > gapHigh) {
      return 'bearish';
    }
    return 'bullish';
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border/20 bg-card/50">
      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">BTC/USDT</span>
          <span className="text-xs text-muted-foreground">(Binance - 4h)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="flex">
        {/* TradingView Chart */}
        <div className="flex-1" style={{ height: `${height}px` }}>
          <iframe
            src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_btc&symbol=BINANCE%3ABTCUSDT&interval=240&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=1a1a2e&studies=%5B%5D&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&showpopupbutton=0&locale=en&hide_top_toolbar=0&allow_symbol_change=1"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="BTC/USDT Chart"
            allowFullScreen
          />
        </div>
        
        {/* Gap Zones Panel */}
        <div className="w-48 border-l border-border/20 bg-background/30 p-3 overflow-y-auto" style={{ height: `${height}px` }}>
          <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">CME Gaps</h4>
          <div className="space-y-2">
            {displayGaps.map((gap, index) => {
              const direction = getGapDirection(gap.gapLow, gap.gapHigh);
              const distancePercent = ((gap.gapLow - currentPrice) / currentPrice * 100).toFixed(1);
              
              return (
                <div 
                  key={index} 
                  className={`p-2 rounded-md border ${
                    direction === 'bullish' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-yellow-400">Gap</span>
                    <span className={`text-xs ${direction === 'bullish' ? 'text-green-400' : 'text-red-400'}`}>
                      {direction === 'bullish' ? '↑' : '↓'}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-mono">
                    ${gap.gapLow.toLocaleString()}
                  </p>
                  <p className="text-xs text-foreground font-mono">
                    ${gap.gapHigh.toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${
                    direction === 'bullish' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {distancePercent}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 border-t border-border/20 bg-muted/5">
        <div className="flex items-start gap-2">
          <Info className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Gráfico real do TradingView (Binance). Os gaps CME são mostrados no painel lateral com direção baseada no preço atual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CMEChart;