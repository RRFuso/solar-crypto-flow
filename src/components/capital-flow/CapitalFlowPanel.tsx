import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '@/lib/marketData';
import { toast } from 'sonner';
import { FlowPanelHeader } from './panel/FlowPanelHeader';
import { FlowControls } from './panel/FlowControls';
import { CategoryFilters } from './panel/CategoryFilters';
import { FlowVisualizationContent } from './panel/FlowVisualizationContent';
import { ExplosiveOpportunitiesPanel } from './panel/ExplosiveOpportunitiesPanel';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';

interface CapitalFlowPanelProps {
  onNavigateToChart?: (symbol: string) => void;
}

const CapitalFlowPanel: React.FC<CapitalFlowPanelProps> = ({ onNavigateToChart }) => {
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
    <div className="h-full w-full flex flex-col">
      {/* Header Controls - Altura fixa reduzida */}
      <div className="flex-shrink-0 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm z-10">
        <div className="p-3">
          <FlowPanelHeader 
            chartTimeframe={chartTimeframe}
            onChartTimeframeChange={handleChartTimeframeChange}
          />
        </div>
        
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between gap-3">
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

      {/* Main Content Area - Layout horizontal otimizado */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - AI Watchlist - Largura fixa reduzida */}
        <div className="w-72 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <FlowVisualizationContent 
            isLoading={isLoading}
            error={error}
            processedFlowData={processedFlowData}
            zoomLevel={zoomLevel}
            filteredPredictions={filteredPredictions}
            chartTimeframe={chartTimeframe}
            activeCategory={activeCategory}
            showSidebarOnly={true}
            onNavigateToChart={onNavigateToChart}
          />
        </div>

        {/* Center - Main Visualization */}
        <div className="flex-1 relative min-h-0">
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

        {/* Right Sidebar - Explosive Opportunities */}
        <div className="w-80 flex-shrink-0 border-l border-slate-700/50 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <ExplosiveOpportunitiesPanel 
            predictions={filteredPredictions}
            onNavigateToChart={onNavigateToChart}
          />
        </div>
      </div>
    </div>
  );
};

export default CapitalFlowPanel;