
import React from 'react';
import { IndexRotationResult } from '@/types/indices';

interface MarketFlowLegendProps {
  data: IndexRotationResult;
}

export const MarketFlowLegend: React.FC<MarketFlowLegendProps> = ({ data }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm text-white/80">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-green"></div>
        <span>Capital Inflow</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-neon-red"></div>
        <span>Capital Outflow</span>
      </div>
      {data.indices.map(index => (
        <div key={index.id} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: index.color }}
          ></div>
          <span>{index.name}</span>
        </div>
      ))}
    </div>
  );
};
