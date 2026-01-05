import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSocketIndicatorProps {
  isConnected: boolean;
  className?: string;
  showLabel?: boolean;
}

export const WebSocketIndicator: React.FC<WebSocketIndicatorProps> = ({
  isConnected,
  className,
  showLabel = false
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {showLabel && <span className="text-xs text-green-400">Live</span>}
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          {showLabel && <span className="text-xs text-red-400">Offline</span>}
        </>
      )}
    </div>
  );
};
