
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowBigRight, TrendingUp, TrendingDown, RefreshCcw, Bitcoin, Diamond, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const { toast } = useToast();

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching data",
          description: "Failed to fetch market data. Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  const maxFlow = Math.max(...(flowData?.map(d => d.value) || [1]));

  const getCryptoIcon = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BTC':
        return <Bitcoin className="w-6 h-6 text-neon-blue" />;
      case 'LARGE':
        return <Diamond className="w-6 h-6 text-neon-blue" />;
      default:
        return <Coins className="w-6 h-6 text-neon-blue" />;
    }
  };

  const getFlowColor = (percentage: number) => {
    return percentage > 0 ? 'text-neon-green' : 'text-neon-red';
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-blue/90 to-neon-blue/70 bg-clip-text text-transparent">
          Capital Flow 🚀
        </h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-white/5 border-white/10 hover:bg-white/10"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-neon-red">
          Failed to load market data
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-full h-full flex flex-wrap gap-8 items-center justify-center p-4">
            {flowData?.map((flow, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-2">
                        {getCryptoIcon(flow.from)}
                        <span className="text-white">{flow.from}</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <ArrowBigRight 
                          className={`w-12 h-12 transition-all duration-300 animate-flow-pulse ${getFlowColor(flow.percentage)}`}
                          style={{
                            opacity: 0.3 + (flow.value / maxFlow) * 0.7,
                            transform: `scale(${0.8 + (flow.value / maxFlow) * 0.4})`
                          }}
                        />
                        <div className="flex items-center gap-1 text-sm">
                          {flow.percentage > 0 ? (
                            <TrendingUp className="w-4 h-4 text-neon-green" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-neon-red" />
                          )}
                          <span className={`font-medium ${getFlowColor(flow.percentage)}`}>
                            {flow.percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-2">
                        {getCryptoIcon(flow.to)}
                        <span className="text-white">{flow.to}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Flow Value: {flow.value.toFixed(2)}</p>
                    <p>Change: {flow.percentage.toFixed(2)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
