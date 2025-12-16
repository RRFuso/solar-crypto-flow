import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CMEChartProps {
  height?: number;
}

export const CMEChart: React.FC<CMEChartProps> = ({ height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const widgetIdRef = useRef<string>(`tradingview_cme_${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = widgetIdRef.current;
    setIsLoading(true);

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetInner = document.createElement('div');
    widgetInner.id = containerId;
    widgetInner.style.height = `${height - 32}px`;
    widgetInner.style.width = '100%';

    widgetContainer.appendChild(widgetInner);
    containerRef.current.appendChild(widgetContainer);

    // Create and append script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    const config = {
      autosize: false,
      width: '100%',
      height: height - 32,
      symbol: 'CME:BTC1!',
      interval: '240',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(13, 13, 13, 1)',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      container_id: containerId
    };

    script.textContent = JSON.stringify(config);
    
    script.onload = () => {
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setIsLoading(false);
      console.error('Failed to load TradingView widget');
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      widgetContainer.appendChild(script);
      // Hide loading after a timeout in case onload doesn't fire
      setTimeout(() => setIsLoading(false), 3000);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [height]);

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
        ref={containerRef} 
        style={{ height: `${height}px` }}
        className="bg-black/20 relative"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-crypto-dark/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <span className="text-sm text-muted-foreground">Carregando gráfico...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CMEChart;
