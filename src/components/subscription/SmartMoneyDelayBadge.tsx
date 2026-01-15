import React from 'react';
import { Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTierAccess } from '@/hooks/useTierAccess';
import { cn } from '@/lib/utils';

interface SmartMoneyDelayBadgeProps {
  className?: string;
}

export const SmartMoneyDelayBadge: React.FC<SmartMoneyDelayBadgeProps> = ({ className }) => {
  const { getSmartMoneyDelay, tier, showUpgradePrompt } = useTierAccess();
  const delayMs = getSmartMoneyDelay();

  const formatDelay = (ms: number): string => {
    if (ms === 0) return 'Tempo real';
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}min`;
  };

  const isRealTime = delayMs === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors',
              isRealTime
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20',
              className
            )}
            onClick={() => {
              if (!isRealTime) {
                showUpgradePrompt('dados em tempo real');
              }
            }}
          >
            {isRealTime ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Tempo real
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Atraso: {formatDelay(delayMs)}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isRealTime ? (
            <p>Dados de Smart Money em tempo real</p>
          ) : (
            <p>
              Dados de Smart Money com atraso de {formatDelay(delayMs)}.
              <br />
              Faça upgrade para dados em tempo real.
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
