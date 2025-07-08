
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import MarketFlowVisualization from './MarketFlowVisualization';
import { MarketFlowLegend } from './MarketFlowLegend';
import { useMarketRotation } from '@/hooks/useMarketRotation';

const MarketRotationPanel = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useMarketRotation(timeframe);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-blue/90 to-neon-blue/70 bg-clip-text text-transparent">
          Market Capital Rotation 🔄
        </h2>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
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
          Failed to load market rotation data
        </div>
      ) : data ? (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <MarketFlowVisualization data={data} />
          <MarketFlowLegend data={data} />
        </div>
      ) : null}
    </div>
  );
};

export default MarketRotationPanel;
