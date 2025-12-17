import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CMEChartProps {
  height?: number;
}

export const CMEChart: React.FC<CMEChartProps> = ({ height = 400 }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-border/20 bg-card/50">
      <div className="px-4 py-2 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">BTC/USDT</span>
          <span className="text-xs text-muted-foreground">(Binance - Proxy CME)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          <span>CME requer assinatura TradingView</span>
        </div>
      </div>
      <div 
        style={{ height: `${height}px` }}
        className="bg-background/20 relative"
      >
        <iframe
          src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_btc&symbol=BINANCE%3ABTCUSDT&interval=240&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=America%2FNew_York&withdateranges=1&showpopupbutton=0&locale=en"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="BTC/USDT Chart"
          allowFullScreen
        />
      </div>
      <div className="px-4 py-2 border-t border-border/20 bg-amber-500/10">
        <p className="text-xs text-amber-400">
          Nota: Gráfico CME BTC1! requer assinatura TradingView Pro. Exibindo BTCUSDT como proxy. Os gaps CME são calculados com base em dados históricos documentados.
        </p>
      </div>
    </div>
  );
};

export default CMEChart;
