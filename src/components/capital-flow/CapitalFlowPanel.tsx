
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
    <div className="h-full w-full flex flex-col lg:flex-row">
      {/* Left Sidebar - AI Watchlist - Responsive width */}
      <div className="sidebar-constraint lg:w-80 w-full lg:flex-shrink-0 border-b lg:border-r lg:border-b-0 border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
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

      {/* Main Content Area - Uses remaining space */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header Controls - Responsive stacking */}
        <div className="flex-shrink-0 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm z-10">
          <div className="p-3 sm:p-4">
            <FlowPanelHeader 
              chartTimeframe={chartTimeframe}
              onChartTimeframeChange={handleChartTimeframeChange}
            />
          </div>
          
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="responsive-wrapper justify-between gap-4">
              <div className="responsive-wrapper">
                <CategoryFilters 
                  activeCategory={activeCategory}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
              
              <div className="responsive-wrapper">
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

        {/* Main Visualization - Solar system container */}
        <div className="flex-1 relative solar-container">
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
