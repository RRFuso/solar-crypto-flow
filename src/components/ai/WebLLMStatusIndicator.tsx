import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { WebLLMProgress } from '@/lib/ai/webLlmEngine';

interface Props {
  progress: WebLLMProgress;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  idle: { color: 'bg-muted-foreground', label: 'Inativa' },
  loading: { color: 'bg-amber-500', label: 'Carregando' },
  ready: { color: 'bg-emerald-500', label: 'Pronta' },
  error: { color: 'bg-destructive', label: 'Erro' },
  offline: { color: 'bg-muted-foreground', label: 'Offline' },
};

const WebLLMStatusIndicator: React.FC<Props> = ({ progress }) => {
  const cfg = statusConfig[progress.status] || statusConfig.idle;

  return (
    <div className="px-3 py-1.5 border-b border-border">
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`w-2 h-2 rounded-full ${cfg.color} flex-shrink-0`} />
        <span className="text-muted-foreground">IA Local:</span>
        <span className="text-foreground font-medium">{cfg.label}</span>
        {progress.status === 'loading' && (
          <span className="text-muted-foreground ml-auto">{progress.progress}%</span>
        )}
      </div>
      {progress.status === 'loading' && (
        <Progress value={progress.progress} className="h-1 mt-1" />
      )}
    </div>
  );
};

export default React.memo(WebLLMStatusIndicator);
