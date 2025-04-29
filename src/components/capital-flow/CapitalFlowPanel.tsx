
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, ZoomIn, ZoomOut, Filter, ArrowDownUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { useToast } from '@/hooks/use-toast';
import { FlowVisualization } from './FlowVisualization';
import { FlowLegend } from './FlowLegend';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Slider
} from "@/components/ui/slider";

// Crypto categories
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'layer1', label: 'Layer 1' },
  { value: 'defi', label: 'DeFi' },
  { value: 'memecoin', label: 'Memecoins' },
  { value: 'stablecoin', label: 'Stablecoins' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'ai', label: 'AI' },
  { value: 'privacy', label: 'Privacy' },
];

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [zoomLevel, setZoomLevel] = useState(70); // Default zoom level at 40%
  const [flowLimit, setFlowLimit] = useState(30); // Default to 30 flows
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Filter and process flow data
  const processedFlowData = useMemo(() => {
    if (!flowData) return [];
    
    // Sort by value (volume) to get the most significant flows
    let sortedFlows = [...flowData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    
    // Filter by category if selected
    if (selectedCategory !== 'all') {
      sortedFlows = sortedFlows.filter(flow => 
        flow.fromCategory === selectedCategory || 
        flow.toCategory === selectedCategory
      );
    }
    
    // Limit to the top N flows to reduce visual clutter
    return sortedFlows.slice(0, flowLimit);
  }, [flowData, flowLimit, selectedCategory]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 40));
  };

  const handleLimitChange = (value: number[]) => {
    setFlowLimit(value[0]);
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
          {/* Zoom Controls */}
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
          
          {/* Flow Limit Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white/5 border-white/10 hover:bg-white/10 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="text-xs">{flowLimit} Flows</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-900 border-gray-800">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-300">Visible Flows</h4>
                <Slider
                  defaultValue={[flowLimit]}
                  max={100}
                  min={5}
                  step={5}
                  onValueChange={handleLimitChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>5 (Less clutter)</span>
                  <span>100 (More detail)</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              {CATEGORIES.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Timeframe Selector */}
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
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
          <FlowVisualization 
            flowData={processedFlowData} 
            zoomLevel={zoomLevel} 
          />
          
          {/* Legend */}
          <FlowLegend />
        </div>
      )}
    </div>
  );
};

export default CapitalFlowPanel;
