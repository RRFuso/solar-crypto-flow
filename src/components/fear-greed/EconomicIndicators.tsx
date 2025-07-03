import React, { useEffect, useRef } from 'react';
import { TrendingUp, DollarSign, LineChart } from 'lucide-react';

interface EconomicIndicatorsProps {
  dxy: string;
  spx: string;
  nasdaq: string;
}

const EconomicIndicators = ({ dxy, spx, nasdaq }: EconomicIndicatorsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous widget
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbol: 'FOREXCOM:DXY',
        width: '100%',
        height: '100%',
        locale: 'br',
        dateRange: '12M',
        colorTheme: 'dark',
        trendLineColor: 'rgba(41, 98, 255, 1)',
        underLineColor: 'rgba(41, 98, 255, 0.3)',
        underLineBottomColor: 'rgba(41, 98, 255, 0)',
        isTransparent: false,
        autosize: true,
        largeChartUrl: '',
        container_id: 'dxy_chart'
      });
      
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full max-w-md space-y-2 p-6 bg-gray-900/50 rounded-lg border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Indicadores Econômicos
          </span>
        </div>
      </div>
      
      <div className="h-40 overflow-hidden rounded-lg border border-gray-700 mb-4">
        <div ref={containerRef} className="w-full h-full" id="dxy_chart"></div>
      </div>
      
      <div className="space-y-3 text-white">
        <div className="flex items-center justify-between py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm">DXY</span>
          </div>
          <span className="text-sm font-bold">{dxy}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-500" />
            <span className="text-sm">S&P 500</span>
          </div>
          <span className="text-sm font-bold">{spx}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-purple-500" />
            <span className="text-sm">NASDAQ</span>
          </div>
          <span className="text-sm font-bold">{nasdaq}</span>
        </div>
      </div>
    </div>
  );
};

export default EconomicIndicators;
