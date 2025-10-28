
import React, { memo, useState, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Studies } from '@/types/tradingview';
import { mapCoinGeckoToTradingView, isValidTradingViewSymbol } from '@/lib/tradingViewMapping';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [chartError, setChartError] = useState(false);
  const [displaySymbol, setDisplaySymbol] = useState<string>('');
  
  // Map CoinGecko ID to correct TradingView symbol
  const tradingViewSymbol = showBtcDominance 
    ? 'BTC.D'
    : mapCoinGeckoToTradingView(crypto);
  
  const containerId = `tradingview_chart_${crypto.id}_${timeframe}`;
  
  // Validate and determine symbol to display
  useEffect(() => {
    if (showBtcDominance) {
      setDisplaySymbol('BINANCE:BTC.D');
      setChartError(false);
      return;
    }
    
    // Check if symbol is valid
    const isValid = isValidTradingViewSymbol(tradingViewSymbol);
    
    if (!isValid) {
      console.warn(`Symbol ${tradingViewSymbol} may not be available on TradingView`);
      setChartError(true);
      // Fallback to BTC
      setDisplaySymbol('BINANCE:BTCUSDT');
    } else {
      setChartError(false);
      setDisplaySymbol(`BINANCE:${tradingViewSymbol}USDT`);
    }
  }, [crypto.id, tradingViewSymbol, showBtcDominance]);
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {showBtcDominance
            ? 'Dominância do Bitcoin (BTC.D)'
            : `${crypto.name} (${tradingViewSymbol})`}
        </h2>
      </div>
      
      {chartError && (
        <div className="px-4 py-2">
          <Alert variant="destructive" className="bg-yellow-900/20 border-yellow-600/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              Gráfico não disponível para {crypto.name}. Exibindo BTC como referência.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
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
