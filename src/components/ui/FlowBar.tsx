import React from 'react';
import { cn } from '@/lib/utils';

interface FlowBarProps {
  value: number;
  maxValue: number;
  type: 'inflow' | 'outflow';
  label: string;
}

export const FlowBar: React.FC<FlowBarProps> = ({ value, maxValue, type, label }) => {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const isInflow = type === 'inflow';
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className={cn(
          "font-medium",
          isInflow ? "text-green-400" : "text-red-400"
        )}>
          {label}
        </span>
        <span className="font-mono text-slate-300">
          ${value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isInflow ? "bg-gradient-to-r from-green-500 to-green-400" : "bg-gradient-to-r from-red-500 to-red-400"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface NetFlowBarProps {
  netFlow: number;
  maxAbsFlow: number;
}

export const NetFlowBar: React.FC<NetFlowBarProps> = ({ netFlow, maxAbsFlow }) => {
  const isPositive = netFlow >= 0;
  // Usar o netFlow absoluto como referência para a barra
  const percentage = maxAbsFlow > 0 ? Math.min((Math.abs(netFlow) / maxAbsFlow) * 100, 100) : 0;
  
  return (
    <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-700">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-slate-200">
          Net Flow
        </span>
        <span className={cn(
          "font-mono font-bold",
          isPositive ? "text-green-400" : "text-red-400"
        )}>
          {isPositive ? '+' : ''}${netFlow.toLocaleString()}
        </span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
        {/* Linha central de referência */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500/50 z-10" />
        {/* Barra de flow - cresce a partir do centro */}
        <div 
          className={cn(
            "absolute h-full rounded-full transition-all duration-500",
            isPositive 
              ? "bg-gradient-to-r from-transparent via-green-500 to-green-400 left-1/2" 
              : "bg-gradient-to-l from-transparent via-red-500 to-red-400 right-1/2"
          )}
          style={{ 
            width: `${percentage / 2}%`,
          }}
        />
      </div>
    </div>
  );
};
