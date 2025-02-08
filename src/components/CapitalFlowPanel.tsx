
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowBigRight, Bitcoin, TrendingUp, TrendingDown, RefreshCcw, Gem, Coins, Wallet } from 'lucide-react';
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

  const getIconForCrypto = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case 'BTC':
        return <Bitcoin className="h-6 w-6" />;
      case 'ETH':
      case 'BNB':
      case 'SOL':
        return <Gem className="h-6 w-6" />;
      case 'DOT':
      case 'AVAX':
      case 'MATIC':
        return <Coins className="h-6 w-6" />;
      default:
        return <Wallet className="h-6 w-6" />;
    }
  };

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
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {flowData?.map((flow, index) => (
            <div 
              key={index}
              className="w-full max-w-md flex items-center gap-4 animate-fade-in group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div 
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-102 ${
                  flow.percentage > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    flow.percentage > 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                  }`}>
                    {getIconForCrypto(flow.from)}
                  </div>
                  <span className="font-semibold text-lg">{flow.from}</span>
                </div>

                <div className="flex items-center gap-2">
                  {flow.percentage > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-medium ${flow.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(flow.percentage).toFixed(2)}%
                  </span>
                  <ArrowBigRight 
                    className={`w-6 h-6 transition-all duration-300 ${
                      flow.percentage > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                    style={{
                      opacity: 0.3 + (flow.value / maxFlow) * 0.7,
                      transform: `scale(${0.8 + (flow.value / maxFlow) * 0.4})`
                    }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">{flow.to}</span>
                  <div className={`p-2 rounded-full ${
                    flow.percentage > 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                  }`}>
                    {getIconForCrypto(flow.to)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
