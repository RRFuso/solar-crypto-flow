
import React, { memo } from 'react';
import TradingViewWidget from 'react-tradingview-widget';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "5" | "15" | "30" | "240" | "D" | "W"; // Updated to include all available timeframes
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
        <TradingViewWidget
          symbol={`BINANCE:${crypto.id}${symbol}`}
          theme="Dark"
          autosize
          interval={timeframe}
          timezone="Etc/UTC"
          style="1"
          locale="pt"
          toolbar_bg="#1a1b1e"
          enable_publishing={false}
          hide_top_toolbar={false}
          allow_symbol_change={false}
          studies={["RSI@tv-basicstudies", "StochRSI@tv-basicstudies"]}
          container_id={containerId}
        />
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
