
import React, { memo, useEffect, useRef } from 'react';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "D" | "W" | "240"; // Added timeframe prop
}

const CryptoChart = ({ crypto, showBtcDominance = false, timeframe = "D" }: CryptoChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const symbol = showBtcDominance 
    ? 'BTC.D'
    : 'USDT' // Now always using USDT pair except for BTC.D

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous widget
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
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
        studies: ['RSI@tv-basicstudies', 'StochRSI@tv-basicstudies'],
        container_id: 'tradingview_chart'
      });
      
      containerRef.current.appendChild(script);
    }
  }, [crypto.id, symbol, timeframe]);
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : `${crypto.name} (${crypto.id}/USDT)`}
        </h2>
      </div>
      <div className="h-[calc(100%-4rem)]">
        <div ref={containerRef} className="w-full h-full" id="tradingview_chart"></div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
