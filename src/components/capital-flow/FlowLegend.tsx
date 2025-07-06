
import React from 'react';

export const FlowLegend: React.FC = () => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-3 shadow-xl">
      <div className="flex items-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <span className="text-slate-300">AI: Strong Buy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
          <span className="text-slate-300">AI: Hold</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
          <span className="text-slate-300">AI: Strong Sell</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span className="text-slate-300">High Volume</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span className="text-slate-300">High Explosive Potential</span>
        </div>
      </div>
    </div>
  );
};
