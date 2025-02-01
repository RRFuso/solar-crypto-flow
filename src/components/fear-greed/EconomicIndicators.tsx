import React from 'react';
import { TrendingUp, DollarSign, LineChart } from 'lucide-react';

interface EconomicIndicatorsProps {
  dxy: string;
  spx: string;
  nasdaq: string;
}

const EconomicIndicators = ({ dxy, spx, nasdaq }: EconomicIndicatorsProps) => {
  return (
    <div className="w-96 space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium">Indicadores Econômicos</span>
        </div>
      </div>
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-green-500" />
            <span className="text-xs">DXY</span>
          </div>
          <span className="text-xs font-medium">{dxy}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-3 h-3 text-blue-500" />
            <span className="text-xs">S&P 500</span>
          </div>
          <span className="text-xs font-medium">{spx}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-3 h-3 text-purple-500" />
            <span className="text-xs">NASDAQ</span>
          </div>
          <span className="text-xs font-medium">{nasdaq}</span>
        </div>
      </div>
    </div>
  );
};

export default EconomicIndicators;