
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowBigRight, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { useToast } from '@/hooks/use-toast';

interface FlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
}

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const { toast } = useToast();

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error fetching data",
          description: error.message || "Failed to fetch market data. Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  const maxFlow = Math.max(...(flowData?.map(d => d.value) || [1]));

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
          Capital Flow
        </h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-gray-800/50 border-gray-700">
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
            className="bg-gray-800/50 border-gray-700"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400">
          Failed to load market data
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-full h-full flex flex-wrap gap-8 items-center justify-center p-4">
            {flowData?.map((flow, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-gray-800/80 px-6 py-3 rounded-xl border border-gray-700 shadow-lg hover:scale-105 transition-transform duration-200">
                  {flow.from}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ArrowBigRight 
                    className="w-12 h-12 transition-all duration-300" 
                    style={{
                      opacity: 0.3 + (flow.value / maxFlow) * 0.7,
                      color: flow.percentage > 0 ? '#4ade80' : '#ef4444',
                      transform: `scale(${0.8 + (flow.value / maxFlow) * 0.4})`
                    }}
                  />
                  <div className="flex items-center gap-1 text-sm">
                    {flow.percentage > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-medium ${flow.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {flow.percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800/80 px-6 py-3 rounded-xl border border-gray-700 shadow-lg hover:scale-105 transition-transform duration-200">
                  {flow.to}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
