
import React, { memo, useState, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Studies } from '@/types/tradingview';
import { mapCoinGeckoToTradingView, getSymbolVariants } from '@/lib/tradingViewMapping';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
    symbol?: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "D" | "W" | "240"; // Added timeframe prop
}

const CryptoChart = ({ crypto, showBtcDominance = false, timeframe = "D" }: CryptoChartProps) => {
  const [displaySymbol, setDisplaySymbol] = useState<string>('');
  
  // Map CoinGecko ID to correct TradingView symbol
  const tradingViewSymbol = showBtcDominance 
    ? 'BTC.D'
    : mapCoinGeckoToTradingView(crypto);
  
  const containerId = `tradingview_chart_${crypto.id}_${timeframe}`;
  
  // Get the best symbol variant to display
  useEffect(() => {
    const variants = getSymbolVariants(tradingViewSymbol);
    // Use the first variant (most likely to work)
    setDisplaySymbol(variants[0]);
  }, [crypto.id, tradingViewSymbol]);
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : `${crypto.name} (${tradingViewSymbol})`}
        </h2>
      </div>
      
      <div className="flex-1 min-h-0">
        {displaySymbol && (
          <AdvancedRealTimeChart
            symbol={displaySymbol}
            theme="dark"
            autosize
            interval={timeframe}
            timezone="Etc/UTC"
            style="1"
            locale="br"
            toolbar_bg="#1a1b1e"
            enable_publishing={false}
            hide_top_toolbar={false}
            allow_symbol_change={true}
            studies={[
              "MACD@tv-basicstudies",
              "RSI@tv-basicstudies"
            ]}
            container_id={containerId}
          />
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
