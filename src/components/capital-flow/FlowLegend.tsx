
import React from 'react';

export const FlowLegend: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/80">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-green"></div>
        <span>Capital Inflow</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-red"></div>
        <span>Capital Outflow</span>
      </div>
         </div>
  );
};
