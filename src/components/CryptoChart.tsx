import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';

const CryptoChart = ({ crypto }) => {
  const symbol = crypto.id === 'BTC' ? 'BTCUSDT' : `${crypto.id}BTC`;
  
  return (
    <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">
          {crypto.id === 'BTC' ? 'Bitcoin (BTC/USDT)' : `${crypto.name} vs Bitcoin (${crypto.id}/BTC)`}
        </h2>
      </div>
      <div className="h-[calc(100%-4rem)]">
        <TradingViewWidget
          symbol={`BINANCE:${symbol}`}
          theme="Dark"
          autosize
          interval="D"
          timezone="Etc/UTC"
          style="1"
          locale="pt"
          toolbar_bg="#1a1b1e"
          enable_publishing={false}
          hide_top_toolbar={false}
          allow_symbol_change={false}
          container_id="tradingview_chart"
        />
      </div>
    </div>
  );
};

export default CryptoChart;