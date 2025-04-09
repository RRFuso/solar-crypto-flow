
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { useToast } from '@/hooks/use-toast';
import { FlowVisualization } from './FlowVisualization';
import { FlowLegend } from './FlowLegend';

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [zoomLevel, setZoomLevel] = useState(70); // Default zoom level at 70%
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/8b011f9d-f3aa-4409-8750-9bd757d934fc.png" 
            alt="SolarCrypto Logo" 
            className="h-12 object-contain"
          />
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Crypto Capital Flow</h2>
            <p className="text-white/60 text-sm">Market capital movements in real time</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-2">
            <Button 
              variant="outline" 
              size="icon"
              className="bg-white/5 border-white/10 hover:bg-white/10"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white/80 text-xs w-10 text-center">{zoomLevel}%</span>
            <Button 
              variant="outline" 
              size="icon"
              className="bg-white/5 border-white/10 hover:bg-white/10"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
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
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ minHeight: "700px" }}>
          {/* D3 Visualization with zoom level prop */}
          <FlowVisualization flowData={flowData || []} zoomLevel={zoomLevel} />
          
          {/* Legend */}
          <FlowLegend />
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
