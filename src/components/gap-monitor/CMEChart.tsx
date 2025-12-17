import React from 'react';

interface CMEChartProps {
  height?: number;
}

export const CMEChart: React.FC<CMEChartProps> = ({ height = 400 }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-crypto-dark/50">
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">CME BTC Futures</span>
          <span className="text-xs text-muted-foreground">(BTC1!)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      <div 
        style={{ height: `${height}px` }}
        className="bg-black/20 relative"
      >
        <iframe
          src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_cme&symbol=CME%3ABTC1!&interval=240&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&showpopupbutton=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="CME BTC Futures Chart"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default CMEChart;
