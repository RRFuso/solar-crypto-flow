import React, { useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Power } from 'lucide-react';
import { unloadWebLLM, getActiveModelId, type WebLLMProgress } from '@/lib/ai/webLlmEngine';

interface Props {
  progress: WebLLMProgress;
  onUnload?: () => void;
}

const WebLLMStatusIndicator: React.FC<Props> = ({ progress, onUnload }) => {
  const handleUnload = useCallback(async () => {
    await unloadWebLLM();
    onUnload?.();
  }, [onUnload]);

  const modelId = getActiveModelId();

  // Status dot styles
  const dotClass =
    progress.status === 'ready'
      ? 'bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.5)]'
      : progress.status === 'loading'
        ? 'bg-blue-500 animate-pulse shadow-[0_0_6px_2px_rgba(59,130,246,0.5)]'
        : progress.status === 'error'
          ? 'bg-destructive'
          : 'bg-muted-foreground';

  const label =
    progress.status === 'ready'
      ? 'Pronta & Isolada'
      : progress.status === 'loading'
        ? 'Carregando no Worker'
        : progress.status === 'error'
          ? 'Erro'
          : progress.status === 'offline'
            ? 'Offline'
            : 'Desligada';

  return (
    <div className="px-3 py-1.5 border-b border-border">
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
        <span className="text-muted-foreground">IA Local:</span>
        <span className="text-foreground font-medium">{label}</span>
        {modelId && progress.status === 'ready' && (
          <span className="text-muted-foreground truncate max-w-[100px]" title={modelId}>
            ({modelId.includes('gemma') ? 'Gemma 2B' : 'Llama 3.1 8B'})
          </span>
        )}
        {progress.status === 'loading' && (
          <span className="text-muted-foreground ml-auto">{progress.progress}%</span>
        )}
        {progress.status === 'ready' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive"
            onClick={handleUnload}
            title="Descarregar modelo (liberar VRAM)"
          >
            <Power className="h-3 w-3" />
          </Button>
        )}
      </div>
      {progress.status === 'loading' && (
        <Progress value={progress.progress} className="h-1 mt-1" />
      )}
    </div>
  );
};

export default React.memo(WebLLMStatusIndicator);
