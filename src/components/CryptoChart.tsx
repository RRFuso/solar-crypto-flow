
import React, { memo } from 'react';
import { TradingView } from 'react-tradingview-embed';

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
  
  const widgetProps = {
    symbol: `BINANCE:${crypto.id}${symbol}`,
    theme: 'Dark' as const,
    autosize: true,
    interval: timeframe,
    timezone: 'Etc/UTC',
    style: '1' as const,
    locale: 'pt',
    toolbar_bg: '#1a1b1e',
    enable_publishing: false,
    hide_top_toolbar: false,
    allow_symbol_change: false,
    studies: ['RSI@tv-basicstudies', 'StochRSI@tv-basicstudies'],
    width: '100%',
    height: '100%'
  };
  
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
        <TradingView widgetProps={widgetProps} />
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
