
import React from 'react';

export const FlowLegend: React.FC = () => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-3 shadow-xl">
      <div className="flex items-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(14, 89%, 55%)' }}></div>
          <span className="text-slate-300">Potencial Explosivo</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 55%)' }}></div>
          <span className="text-slate-300">Acumulação</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(45, 93%, 55%)' }}></div>
          <span className="text-slate-300">Distribuição</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 83%, 35%)' }}></div>
          <span className="text-slate-300">Reversão de Fundo</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(220, 83%, 35%)' }}></div>
          <span className="text-slate-300">Capitulação</span>
        </div>
      </div>
    </div>
  );
};
