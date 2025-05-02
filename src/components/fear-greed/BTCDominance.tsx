
import React from 'react';
import { Bitcoin } from 'lucide-react';

interface BTCDominanceProps {
  dominance: number;
  dominanceColor: string;
  dominanceText: string;
}

const BTCDominance = ({ dominance, dominanceColor, dominanceText }: BTCDominanceProps) => {
  return (
    <div className="w-full max-w-md space-y-2 p-6 bg-gray-900/50 rounded-lg border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Dominância do Bitcoin
          </span>
        </div>
        <span className="text-lg font-bold text-white">{dominance}%</span>
      </div>
      <div className="h-28 flex items-center justify-center">
        <div className="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full ${dominanceColor} rounded-full transition-all duration-500 shadow-glow`}
            style={{ width: `${dominance}%` }}
          />
        </div>
      </div>
      <div className="text-center text-sm font-bold text-white my-2">
        {dominanceText}
      </div>
    </div>
  );
};

export default BTCDominance;
