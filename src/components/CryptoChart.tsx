import React from 'react';
import TradingViewWidget from 'react-tradingview-widget';

const CryptoChart = ({ crypto }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">{crypto.name} vs BTC</h2>
      <div style={{ height: '400px' }}>
        <TradingViewWidget
          symbol={`BINANCE:${crypto.id}BTC`}
          theme="Dark"
          autosize
          interval="D"
          timezone="Etc/UTC"
          style="1"
          locale="en"
          toolbar_bg="#f1f3f6"
          enable_publishing={false}
          hide_top_toolbar={false}
          allow_symbol_change={true}
          container_id="tradingview_chart"
        />
      </div>
    </div>
  );
};

export default CryptoChart;