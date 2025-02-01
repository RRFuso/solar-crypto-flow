import React from 'react';
import { Bitcoin } from 'lucide-react';

interface BTCDominanceProps {
  dominance: number;
  dominanceColor: string;
  dominanceText: string;
}

const BTCDominance = ({ dominance, dominanceColor, dominanceText }: BTCDominanceProps) => {
  return (
    <div className="w-96 space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-medium">Dominância do Bitcoin</span>
        </div>
        <span className="text-xs font-medium">{dominance}%</span>
      </div>
      <div className="h-20 flex items-center justify-center">
        <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full ${dominanceColor} rounded-full transition-all duration-500`}
            style={{ width: `${dominance}%` }}
          />
        </div>
      </div>
      <div className="text-center text-xs font-medium text-gray-400">
        {dominanceText}
      </div>
    </div>
  );
};

export default BTCDominance;