
import React from 'react';
import { SIGNAL_CATEGORIES } from './constants/signalCategories';

export const FlowLegend: React.FC = () => {
  const categories = Object.values(SIGNAL_CATEGORIES).filter(cat => cat.id !== 'neutral');
  
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-2 md:px-4 py-1 md:py-3 shadow-xl">
      <div className="flex items-center flex-wrap gap-x-3 md:gap-x-6 gap-y-1 md:gap-y-2 text-[10px] md:text-xs">
        {categories.map(category => (
          <div key={category.id} className="flex items-center space-x-1 md:space-x-2">
            <div 
              className="w-2 h-2 md:w-3 md:h-3 rounded-full" 
              style={{ backgroundColor: category.color }}
            ></div>
            <span className="text-slate-300 font-medium">
              {category.name}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-slate-400">
        <span className="font-medium">Sistema Solar:</span> Cores representam sinais de fluxo de capital em tempo real
      </div>
    </div>
  );
};
