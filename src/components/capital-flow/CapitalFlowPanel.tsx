
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCcw, ZoomIn, ZoomOut, Filter, ArrowDownUp, Clock, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchMarketData } from '@/lib/marketData';
import { toast } from 'sonner';
import { FlowVisualization } from './FlowVisualization';
import { FlowLegend } from './FlowLegend';
import { fetchCryptoData, fetchCapitalFlows } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements } from '@/lib/aiModel';
import { Prediction } from '@/lib/aiModel';
import AIWatchlist from '../ai/AIWatchlist';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

// Chart timeframes
const TIMEFRAMES = [
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
];

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(40); // Default zoom level at 40%
  const [flowLimit, setFlowLimit] = useState(30); // Default to 30 flows
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showOnlyStrongSignals, setShowOnlyStrongSignals] = useState(false);

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast("Failed to fetch market data. Please try again later.", {
          description: "An error occurred while fetching market data.",
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

  // Filter predictions based on showOnlyStrongSignals setting
  const filteredPredictions = useMemo(() => {
    if (showOnlyStrongSignals) {
      return predictions.filter(p => p.confidence >= 0.6);
    }
    return predictions;
  }, [predictions, showOnlyStrongSignals]);

  // Update AI predictions
  useEffect(() => {
    const updatePredictions = async () => {
      if (!flowData || flowData.length === 0) return;
      
      try {
        // Get unique crypto symbols from the flow data
        const symbols = [...new Set([
          ...flowData.map(flow => flow.from),
          ...flowData.map(flow => flow.to)
        ])];
        
        // Get crypto data for these symbols
        const cryptoData = await fetchCryptoData();
        const relevantCryptos = cryptoData.filter(
          crypto => symbols.includes(crypto.symbol)
        );
        
        if (relevantCryptos.length > 0) {
          // Apply category filter if needed
          const categoryFilteredCryptos = selectedCategory !== 'all' 
            ? relevantCryptos.filter(crypto => crypto.category === selectedCategory)
            : relevantCryptos;
            
          // Get features and make predictions with the selected chart timeframe
          const features = await extractFeatures(categoryFilteredCryptos, flowData, chartTimeframe);
          const newPredictions = predictPriceMovements(features, chartTimeframe);
          setPredictions(newPredictions);
          
          // Show notifications for high confidence predictions
          showPredictionAlerts(newPredictions);
        }
      } catch (error) {
        console.error("Error updating AI predictions:", error);
      }
    };
    
    updatePredictions();
    // Update predictions whenever flow data, category, or chart timeframe changes
    // Use a shorter interval for shorter timeframes
    const intervalTime = chartTimeframe === '5m' || chartTimeframe === '15m' ? 60000 : 300000;
    const interval = setInterval(updatePredictions, intervalTime);
    
    return () => clearInterval(interval);
  }, [flowData, selectedCategory, chartTimeframe]);

  // Show notifications for high confidence predictions
  const showPredictionAlerts = (predictions: Prediction[]) => {
    const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8);
    
    highConfidencePredictions.forEach(prediction => {
      const emoji = prediction.bullish ? '🚀' : '🔻';
      const direction = prediction.bullish ? 'bullish' : 'bearish';
      const factors = prediction.factors.slice(0, 2).join(' + ');
      
      toast(`${emoji} ${prediction.symbol} ${direction} signal (${chartTimeframe})`, {
        description: `${factors}. Confidence: ${Math.round(prediction.confidence * 100)}%`,
        duration: 8000,
        className: prediction.bullish ? 'bg-green-900/60' : 'bg-red-900/60',
      });
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 10)); // Minimum 10% zoom
  };

  const handleLimitChange = (value: number[]) => {
    setFlowLimit(value[0]);
  };

  const handleChartTimeframeChange = (value: string) => {
    setChartTimeframe(value);
    // Trigger prediction recalculation
    refetch();
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
          {/* Chart Timeframe Selector */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md">
            <Clock size={14} className="text-gray-400" />
            <Select value={chartTimeframe} onValueChange={handleChartTimeframeChange}>
              <SelectTrigger className="w-24 border-none bg-transparent text-white/80 h-6 py-0 px-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                {TIMEFRAMES.map(tf => (
                  <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strong Signal Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md">
            <div className="flex items-center space-x-2">
              <Switch
                id="strong-signals"
                checked={showOnlyStrongSignals}
                onCheckedChange={setShowOnlyStrongSignals}
              />
              <Label htmlFor="strong-signals" className="text-white/80 text-xs">
                Strong signals only
              </Label>
            </div>
          </div>
          
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

      <div className="flex gap-6 flex-1" style={{ minHeight: "700px" }}>
        {/* Main Visualization Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-neon-red">
              Failed to load market data
            </div>
          ) : (
            <>
              {/* D3 Visualization with zoom level prop */}
              <FlowVisualization 
                flowData={processedFlowData} 
                zoomLevel={zoomLevel}
                predictions={filteredPredictions} 
                chartTimeframe={chartTimeframe}
              />
              
              {/* Legend */}
              <FlowLegend />
            </>
          )}
        </div>
        
        {/* AI Watchlist Sidebar */}
        {filteredPredictions.length > 0 && (
          <div className="w-64 h-full">
            <AIWatchlist 
              predictions={filteredPredictions} 
              maxItems={8} 
              chartTimeframe={chartTimeframe}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CapitalFlowPanel;
