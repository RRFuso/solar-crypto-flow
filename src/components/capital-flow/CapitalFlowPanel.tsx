
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '@/lib/marketData';
import { toast } from 'sonner';
import { FlowPanelHeader } from './panel/FlowPanelHeader';
import { FlowControls } from './panel/FlowControls';
import { CategoryFilters } from './panel/CategoryFilters';
import { FlowVisualizationContent } from './panel/FlowVisualizationContent';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(60);
  const [flowLimit, setFlowLimit] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyStrongSignals, setShowOnlyStrongSignals] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast("Failed to fetch market data. Please try again later.", {
          description: "An error occurred while fetching market data."
        });
      }
    }
  });

  const processedFlowData = useFilteredFlowData(flowData, flowLimit, activeCategory);
  const { predictions } = usePredictions(flowData, selectedCategory, chartTimeframe);

  const filteredPredictions = React.useMemo(() => {
    if (showOnlyStrongSignals) {
      return predictions.filter(p => p.confidence >= 0.6);
    }
    return predictions;
  }, [predictions, showOnlyStrongSignals]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 20));
  const handleLimitChange = (value: number[]) => setFlowLimit(value[0]);
  const handleChartTimeframeChange = (value: string) => {
    setChartTimeframe(value);
    refetch();
  };
  const handleCategoryClick = (category: string) => setActiveCategory(category);

  return (
    // CORRECTED: Use h-full w-full flex, remove top-level overflow-hidden
    <div className="h-full w-full flex">
      {/* Left Sidebar - AI Watchlist - Fixed width, allow vertical scroll */}
      <div className="w-80 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-y-auto overflow-x-hidden"> {/* Allow Y scroll */} 
        <FlowVisualizationContent 
          isLoading={isLoading}
          error={error}
          processedFlowData={processedFlowData}
          zoomLevel={zoomLevel}
          filteredPredictions={filteredPredictions}
          chartTimeframe={chartTimeframe}
          activeCategory={activeCategory}
          showSidebarOnly={true}
        />
      </div>

      {/* Main Content Area - Takes remaining space, allow scroll if needed */}
      {/* CORRECTED: Remove min-w-0 and overflow-hidden, allow scroll */}
      <div className="flex-1 flex flex-col overflow-auto"> 
        {/* Header Controls - Fixed height */}
        <div className="flex-shrink-0 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm z-10"> {/* Added z-index */} 
          <div className="p-4">
            <FlowPanelHeader 
              chartTimeframe={chartTimeframe}
              onChartTimeframeChange={handleChartTimeframeChange}
            />
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap"> {/* Added flex-wrap */} 
              <div className="flex-shrink-0">
                <CategoryFilters 
                  activeCategory={activeCategory}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
              
              <div className="flex-shrink-0">
                <FlowControls
                  chartTimeframe={chartTimeframe}
                  showOnlyStrongSignals={showOnlyStrongSignals}
                  setShowOnlyStrongSignals={setShowOnlyStrongSignals}
                  zoomLevel={zoomLevel}
                  handleZoomIn={handleZoomIn}
                  handleZoomOut={handleZoomOut}
                  flowLimit={flowLimit}
                  handleLimitChange={handleLimitChange}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onRefresh={() => refetch()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Visualization - Takes remaining height, ensure it can scroll if content overflows */}
        {/* CORRECTED: Remove overflow-hidden, ensure relative positioning works */}
        <div className="flex-1 relative min-h-[600px]"> {/* Ensure minimum height, relative for absolute children */} 
          <FlowVisualizationContent 
            isLoading={isLoading}
            error={error}
            processedFlowData={processedFlowData}
            zoomLevel={zoomLevel}
            filteredPredictions={filteredPredictions}
            chartTimeframe={chartTimeframe}
            activeCategory={activeCategory}
            showSidebarOnly={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CapitalFlowPanel;

