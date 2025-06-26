import React, { memo, useEffect, useRef } from 'react';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "D" | "W" | "240";
  showExplosiveIndicators?: boolean;
}

const CryptoChart = ({ 
  crypto, 
  showBtcDominance = false, 
  timeframe = "D",
  showExplosiveIndicators = false 
}: CryptoChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const symbol = showBtcDominance 
    ? 'BTC.D'
    : 'USDT'

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous widget
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      
      // Configurar estudos baseado no tipo de análise
      const studies = showExplosiveIndicators 
        ? [
            'SuperTrend AI (Clustering)@LuxAlgo',
            'LuxAlgo - SuperTrend AI@LuxAlgo', 
            'RSI Divergence Indicator@tradingview'
          ]
        : ['RSI@tv-basicstudies', 'StochRSI@tv-basicstudies'];

      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: `BINANCE:${crypto.id}${symbol}`,
        interval: timeframe,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'pt',
        toolbar_bg: '#1a1b1e',
        enable_publishing: false,
        hide_top_toolbar: false,
        allow_symbol_change: false,
        studies: studies,
        container_id: 'tradingview_chart'
      });
      
      containerRef.current.appendChild(script);
    }
  }, [crypto.id, symbol, timeframe, showExplosiveIndicators]);
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : `${crypto.name} (${crypto.id}/USDT)`}
        </h2>
        {showExplosiveIndicators && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
              🚀 SuperTrend AI (Clustering)
            </span>
            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
              ⚡ LuxAlgo SuperTrend AI
            </span>
            <span className="text-xs bg-orange-900/50 text-orange-300 px-2 py-1 rounded border border-orange-500/30">
              📊 RSI Divergence
            </span>
          </div>
        )}
      </div>
      <div className="h-[calc(100%-5rem)]">
        <div ref={containerRef} className="w-full h-full" id="tradingview_chart"></div>
      </div>
    </div>
  );
};

export default memo(CryptoChart);