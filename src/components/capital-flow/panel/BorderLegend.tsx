import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BorderLegend: React.FC = () => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1.5 hover:bg-background/90 transition-colors"
        title="Mostrar legenda de bordas"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2.5 space-y-1.5 max-w-[190px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">
          Bordas (Sinais)
        </h4>
        <button onClick={() => setMinimized(true)} className="hover:bg-muted/50 rounded p-0.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1">
        {/* Smart Money golden ring */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-yellow-400" style={{ boxShadow: '0 0 8px rgba(250, 204, 21, 0.7)' }} />
          <span className="text-[10px] text-foreground/70">Smart Money (&gt;70%)</span>
        </div>

        {/* Bullish sentiment ring */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-dashed" style={{ borderColor: '#22c55e' }} />
          <span className="text-[10px] text-foreground/70">Sentimento Bullish</span>
        </div>

        {/* Bearish sentiment ring */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-dashed" style={{ borderColor: '#ef4444' }} />
          <span className="text-[10px] text-foreground/70">Sentimento Bearish</span>
        </div>

        {/* AI Strong Buy border */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#00FF88' }} />
          <span className="text-[10px] text-foreground/70">AI: Strong Buy</span>
        </div>

        {/* AI Strong Sell border */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#FF3366' }} />
          <span className="text-[10px] text-foreground/70">AI: Strong Sell</span>
        </div>

        {/* Explosive potential */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#800080' }} />
          <span className="text-[10px] text-foreground/70">Potencial Explosivo 🚀</span>
        </div>
      </div>

      <div className="pt-1 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground">
          Dados via Alchemy + AI Model
        </p>
      </div>
    </div>
  );
};
