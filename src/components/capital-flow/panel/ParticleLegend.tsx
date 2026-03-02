import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ParticleLegend: React.FC = () => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1.5 hover:bg-background/90 transition-colors"
        title="Mostrar legenda de partículas"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2.5 space-y-1.5 max-w-[180px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider">
          Partículas (Fluxo)
        </h4>
        <button onClick={() => setMinimized(true)} className="hover:bg-muted/50 rounded p-0.5">
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1">
        {/* Bullish particles */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span className="text-[10px] text-foreground/70">Bullish — Saída de exchanges</span>
        </div>

        {/* Bearish particles */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
          <span className="text-[10px] text-foreground/70">Bearish — Entrada em exchanges</span>
        </div>

        {/* Neutral particles */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#facc15', boxShadow: '0 0 4px #facc15' }} />
          <span className="text-[10px] text-foreground/70">Neutro — Sem dados on-chain</span>
        </div>

        {/* High confidence */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }} />
          <span className="text-[10px] text-foreground/70">Alta Confiança (&gt;60%)</span>
        </div>
      </div>

      <div className="pt-1 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground">
          Velocidade = intensidade do fluxo on-chain
        </p>
      </div>
    </div>
  );
};
