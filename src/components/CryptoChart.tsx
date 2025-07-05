
import React, { memo } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "D" | "W" | "240"; // Added timeframe prop
}

const CryptoChart = ({ crypto, showBtcDominance = false, timeframe = "D" }: CryptoChartProps) => {
  const symbol = showBtcDominance 
    ? 'BTC.D'
    : 'USDT' // Now always using USDT pair except for BTC.D
  
  const containerId = `tradingview_chart_${crypto.id}_${timeframe}`;
  
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
        <AdvancedRealTimeChart
          symbol={`BINANCE:${crypto.id}${symbol}`}
          theme="dark"
          autosize
          interval={timeframe}
          timezone="Etc/UTC"
          style="1"
          locale="br"
          toolbar_bg="#1a1b1e"
          enable_publishing={false}
          hide_top_toolbar={false}
          allow_symbol_change={false}
          studies={["SuperTrend AI (Clustering)@LuxAlgo", "RSI Divergence Indicator@tv-basicstudies"]}
          container_id={containerId}
        />
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
