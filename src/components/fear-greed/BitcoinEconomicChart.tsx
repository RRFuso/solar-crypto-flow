import React from 'react';
import { LineChart, ArrowDown, ArrowUp } from 'lucide-react';
import TradingViewWidget from 'react-tradingview-embed';

interface BitcoinEconomicChartProps {
  btcPrice: string;
  btcChange: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

const BitcoinEconomicChart = ({ 
  btcPrice, 
  btcChange, 
  marketSentiment 
}: BitcoinEconomicChartProps) => {
  const sentimentColors = {
    bullish: 'from-green-500 to-green-300',
    bearish: 'from-red-500 to-red-300',
    neutral: 'from-blue-500 to-blue-300'
  };

  const sentimentText = {
    bullish: 'Mercado Otimista',
    bearish: 'Mercado Pessimista',
    neutral: 'Mercado Neutro'
  };

  const sentimentIcon = {
    bullish: <ArrowUp className="w-5 h-5 text-green-500" />,
    bearish: <ArrowDown className="w-5 h-5 text-red-500" />,
    neutral: <LineChart className="w-5 h-5 text-blue-500" />
  };

  const btcWidgetProps = {
    symbol: 'BTCUSD',
    interval: 'D' as const,
    timezone: 'Etc/UTC',
    locale: 'br',
    allow_symbol_change: false,
    hide_side_toolbar: true,
    hide_legend: true,
    save_image: false,
    autosize: true,
    width: '100%',
    height: '100%'
  };

  return (
    <div className="w-full max-w-md space-y-2 p-6 bg-gray-900/50 rounded-lg border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LineChart className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Bitcoin vs Mercado
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 bg-gradient-to-r ${sentimentColors[marketSentiment]} bg-opacity-20 text-white`}>
          {sentimentIcon[marketSentiment]}
          <span>{sentimentText[marketSentiment]}</span>
        </div>
      </div>
      
      <div className="h-40 overflow-hidden rounded-lg border border-gray-700 mb-4">
        <TradingViewWidget widgetProps={btcWidgetProps} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-white">
        <div className="flex flex-col p-3 rounded-lg bg-gray-800/40 border border-gray-700">
          <span className="text-xs text-gray-400">Bitcoin</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">${btcPrice}</span>
            <span className={`text-sm ${btcChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {btcChange >= 0 ? '+' : ''}{btcChange}%
            </span>
          </div>
        </div>
        <div className="flex flex-col p-3 rounded-lg bg-gray-800/40 border border-gray-700">
          <span className="text-xs text-gray-400">Correlação SPX</span>
          <div className="flex items-center justify-between mt-1">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  marketSentiment === 'bullish' ? 'bg-green-500' : 
                  marketSentiment === 'bearish' ? 'bg-red-500' : 'bg-blue-500'
                }`} 
                style={{ width: `${Math.abs(btcChange * 5)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinEconomicChart;
