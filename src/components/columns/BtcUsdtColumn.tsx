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

interface BtcUsdtColumnProps {
  data: {
    price: string;
    priceChange: number;
    volume: string;
    high24h: string;
    low24h: string;
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export const BtcUsdtColumn = ({ data, onRefresh, isLoading }: BtcUsdtColumnProps) => {
  return (
    <div className="flex flex-col h-full bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold">BTC/USDT</h3>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onRefresh}
          className={isLoading ? "animate-spin" : ""}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-4 rounded-lg bg-gray-800/50">
                <div className="text-2xl font-bold mb-2">${data.price}</div>
                <div className={`text-lg ${data.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {data.priceChange >= 0 ? "+" : ""}{data.priceChange.toFixed(2)}%
                </div>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <div>Volume: ${data.volume}</div>
                  <div>24h High: ${data.high24h}</div>
                  <div>24h Low: ${data.low24h}</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>Current Price: ${data.price}</p>
                <p>24h Change: {data.priceChange.toFixed(2)}%</p>
                <p>Volume: ${data.volume}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};