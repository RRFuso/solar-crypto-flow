
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
import { useFlowAnalysis } from '@/hooks/capital-flow/useFlowAnalysis'; // Import the new hook

const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [zoomLevel, setZoomLevel] = useState(40); // Default zoom level at 40%
  const [flowLimit, setFlowLimit] = useState(30); // Default to 30 flows
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyStrongSignals, setShowOnlyStrongSignals] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all'); // Track active category filter

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

  // Get processed flow data based on filters
  const processedFlowData = useFilteredFlowData(flowData, flowLimit, activeCategory);
  
  // Get AI analysis from the FastAPI backend
  const { data: flowAnalysisData, isLoading: isAnalysisLoading } = useFlowAnalysis(processedFlowData);
  
  // Get AI predictions
  const { predictions } = usePredictions(flowData, selectedCategory, chartTimeframe);

  // Filter predictions based on showOnlyStrongSignals setting
  const filteredPredictions = React.useMemo(() => {
    if (showOnlyStrongSignals) {
      return predictions.filter(p => p.confidence >= 0.6);
    }
    return predictions;
  }, [predictions, showOnlyStrongSignals]);

  // Merge flow data with analysis data when available
  const enhancedFlowData = React.useMemo(() => {
    if (!flowAnalysisData || isAnalysisLoading) return processedFlowData;
    
    return processedFlowData.map(flow => {
      const analysis = flowAnalysisData.find(analysis => 
        analysis.fluxo_in === (flow.volume || 0) && 
        analysis.fluxo_out === (flow.outflow || 0)
      );
      
      if (analysis) {
        return {
          ...flow,
          category: analysis.categoria
        };
      }
      return flow;
    });
  }, [processedFlowData, flowAnalysisData, isAnalysisLoading]);

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

  // Handle category filter click
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 bg-crypto-dark backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
      {/* Header with logo and title */}
      <FlowPanelHeader 
        chartTimeframe={chartTimeframe}
        onChartTimeframeChange={handleChartTimeframeChange}
      />

      <div className="flex items-center justify-between">
        {/* Add an empty div to help with layout */}
        <div></div>
        
        {/* Control buttons and filters */}
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

      {/* Category Filter Badges */}
      <CategoryFilters 
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Main Visualization Content */}
      <FlowVisualizationContent 
        isLoading={isLoading || isAnalysisLoading}
        error={error}
        processedFlowData={enhancedFlowData}
        zoomLevel={zoomLevel}
        filteredPredictions={filteredPredictions}
        chartTimeframe={chartTimeframe}
        activeCategory={activeCategory}
      />
    </div>
  );
};

export default CapitalFlowPanel;
