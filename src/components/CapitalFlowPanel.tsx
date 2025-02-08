
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowBigRight, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface FlowData {
  from: string;
  to: string;
  value: number;
  percentage: number;
}

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');

  const { data: flowData, isLoading } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: async () => {
      // Temporary mock data - replace with actual API call
      const mockData: FlowData[] = [
        { from: 'BTC', to: 'ETH', value: 1500000, percentage: 2.5 },
        { from: 'BTC', to: 'SOL', value: 800000, percentage: 1.8 },
        { from: 'ETH', to: 'SOL', value: 300000, percentage: 0.5 },
      ];
      return mockData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const maxFlow = Math.max(...(flowData?.map(d => d.value) || [1]));

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Capital Flow</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-full h-full flex flex-wrap gap-8 items-center justify-center p-4">
            {flowData?.map((flow, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  {flow.from}
                </div>
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-8 h-8 text-blue-500" 
                    style={{
                      opacity: flow.value / maxFlow
                    }}
                  />
                  <span className="text-sm text-gray-400">
                    {flow.percentage > 0 ? `+${flow.percentage}%` : `${flow.percentage}%`}
                  </span>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
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
