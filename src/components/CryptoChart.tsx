
import React, { memo } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Studies } from '@/types/tradingview';
import { mapCoinGeckoToTradingView } from '@/lib/tradingViewMapping';

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
  // Map CoinGecko ID to correct TradingView symbol
  const tradingViewSymbol = showBtcDominance 
    ? 'BTC.D'
    : mapCoinGeckoToTradingView(crypto);
  
  const containerId = `tradingview_chart_${crypto.id}_${timeframe}`;
  
  // Try multiple exchanges to find the chart
  const getSymbolVariants = () => {
    if (showBtcDominance) return ['BINANCE:BTC.D'];
    
    // Try different exchange/quote currency combinations
    const variants = [
      `BINANCE:${tradingViewSymbol}USDT`,
      `BINANCE:${tradingViewSymbol}BUSD`,
      `COINBASE:${tradingViewSymbol}USD`,
      `KRAKEN:${tradingViewSymbol}USD`,
      `BITFINEX:${tradingViewSymbol}USD`,
    ];
    
    return variants;
  };
  
  const symbolVariants = getSymbolVariants();
  const primarySymbol = symbolVariants[0];
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : `${crypto.name} (${tradingViewSymbol})`}
        </h2>
        {!showBtcDominance && (
          <p className="text-xs text-gray-400 mt-1">
            Gráfico pode não estar disponível para todos os ativos
          </p>
        )}
      </div>
      <div className="h-[calc(100%-4rem)]">
        <AdvancedRealTimeChart
          symbol={primarySymbol}
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
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CryptoChart);
