
import React from 'react';
import { TrendingUp, DollarSign, LineChart } from 'lucide-react';
import TradingViewWidget from 'react-tradingview-widget';

interface EconomicIndicatorsProps {
  dxy: string;
  spx: string;
  nasdaq: string;
}

const EconomicIndicators = ({ dxy, spx, nasdaq }: EconomicIndicatorsProps) => {
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
        <TradingViewWidget
          symbol="FOREXCOM:DXY"
          theme="dark"
          locale="br"
          autosize
          hide_top_toolbar
          hide_legend
          hide_side_toolbar
          allow_symbol_change={false}
          style={{
            height: "100%",
            width: "100%"
          }}
        />
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
