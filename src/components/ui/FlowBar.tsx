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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-slate-600" />
        </div>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isPositive 
              ? "bg-gradient-to-r from-green-500 to-green-400 ml-auto" 
              : "bg-gradient-to-l from-red-500 to-red-400"
          )}
          style={{ width: `${percentage / 2}%` }}
        />
      </div>
    </div>
  );
};
