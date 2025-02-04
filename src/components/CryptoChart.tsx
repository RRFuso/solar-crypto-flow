import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';

interface CryptoChartProps {
  crypto: {
    id: string;
    name: string;
  };
  showBtcDominance?: boolean;
  timeframe?: "D" | "W" | "240";
  indicators?: {
    ema: {
      enabled: boolean;
      periods: number[];
    };
    rsi: {
      enabled: boolean;
      period: number;
      overbought: number;
      oversold: number;
    };
    macd: {
      enabled: boolean;
      fast: number;
      slow: number;
      signal: number;
    };
    bollinger: {
      enabled: boolean;
      period: number;
      stdDev: number;
    };
    volume: {
      enabled: boolean;
      period: number;
    };
  };
}

const CryptoChart = ({ crypto, showBtcDominance = false, timeframe = "D", indicators }: CryptoChartProps) => {
  const symbol = showBtcDominance 
    ? 'BTC.D'
    : 'USDT'
  
  // Convert indicators to TradingView studies format
  const getStudies = () => {
    const studies: string[] = [];
    
    if (indicators) {
      if (indicators.rsi.enabled) {
        studies.push("RSI@tv-basicstudies");
      }
      if (indicators.macd.enabled) {
        studies.push("MACD@tv-basicstudies");
      }
      if (indicators.bollinger.enabled) {
        studies.push("BB@tv-basicstudies");
      }
      if (indicators.volume.enabled) {
        studies.push("Volume@tv-basicstudies");
      }
      if (indicators.ema.enabled) {
        indicators.ema.periods.forEach(period => {
          studies.push(`EMA${period}@tv-basicstudies`);
        });
      }
    } else {
      // Default studies if no indicators provided
      studies.push("RSI@tv-basicstudies", "StochRSI@tv-basicstudies");
    }

    return studies;
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
          studies={getStudies()}
          container_id="tradingview_chart"
        />
      </div>
    </div>
  );
};

export default CryptoChart;