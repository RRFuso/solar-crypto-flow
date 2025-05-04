
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApiStatusIndicatorProps {
  isConnected: boolean;
  isLoading: boolean;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  isConnected,
  isLoading
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 px-2 py-1 ${
              isConnected 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span className="text-xs">API Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span className="text-xs">API Offline</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected 
            ? 'FastAPI backend is connected and providing flow analysis' 
            : 'FastAPI backend connection failed - using fallback data'
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
