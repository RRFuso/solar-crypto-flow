import React from 'react';
import { TrendingUp, TrendingDown, Activity, Circle, Crown } from 'lucide-react';

interface OnChainSentimentLegendProps {
  compact?: boolean;
}

export const OnChainSentimentLegend: React.FC<OnChainSentimentLegendProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400">Bullish</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400">Bearish</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <span className="text-yellow-400/70">Neutral</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 space-y-2">
      <h4 className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
        <Activity className="w-3 h-3" />
        Sentimento On-Chain (Alchemy)
      </h4>
      
      <div className="space-y-1.5">
        {/* Bullish indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-green-500/30 animate-pulse" />
            <div className="absolute inset-0.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Bullish</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">Saída de exchanges</span>
        </div>
        
        {/* Bearish indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-red-500/30 animate-pulse" />
            <div className="absolute inset-0.5 rounded-full bg-red-500/60" />
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Bearish</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">Entrada em exchanges</span>
        </div>
        
        {/* Neutral indicator */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500/30 border border-yellow-500/50" />
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-yellow-400/70" />
            <span className="text-xs text-yellow-400/70 font-medium">Neutral</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">Fluxo equilibrado</span>
        </div>

        {/* Premium Smart Money indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-4 h-4 rounded-full border-2 border-yellow-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(250, 204, 21, 0.6)' }} />
            <div className="absolute inset-0.5 rounded-full border border-amber-300/50" />
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">Smart Money</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">Confiança &gt;70%</span>
        </div>
      </div>
      
      <div className="pt-1 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground">
          Dados baseados em fluxos reais de exchanges via Alchemy API
        </p>
      </div>
    </div>
  );
};

export default OnChainSentimentLegend;
