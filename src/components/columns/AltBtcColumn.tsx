import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AltBtcColumnProps {
  data: Array<{
    symbol: string;
    price: string;
    priceChange: number;
    volume: string;
    lastPeak?: string;
  }>;
  onSelect: (symbol: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AltBtcColumn = ({ data, onSelect, onRefresh, isLoading }: AltBtcColumnProps) => {
  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold">Alt/BTC Pairs</h3>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onRefresh}
          className={isLoading ? "animate-spin" : ""}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {data.map((item) => (
            <TooltipProvider key={item.symbol}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => onSelect(item.symbol)}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.symbol}</span>
                      <span className={item.priceChange >= 0 ? "text-green-400" : "text-red-400"}>
                        {item.priceChange >= 0 ? "+" : ""}{item.priceChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.priceChange >= 0 ? "bg-green-400" : "bg-red-400"}`}
                        style={{ width: `${Math.min(Math.abs(item.priceChange), 100)}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>Price: {item.price} BTC</p>
                    <p>Volume: {item.volume}</p>
                    {item.lastPeak && <p>Last Peak: {item.lastPeak}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};