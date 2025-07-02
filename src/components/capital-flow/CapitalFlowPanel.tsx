
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlowPanelHeader } from './panel/FlowPanelHeader';
import { FlowControls } from './panel/FlowControls';
import { FlowVisualizationContent } from './panel/FlowVisualizationContent';
import { CategoryFilters } from './panel/CategoryFilters';
import { ApiStatusIndicator } from './panel/ApiStatusIndicator';
import { useFilteredFlowData } from '@/hooks/capital-flow/useFilteredFlowData';
import { usePredictions } from '@/hooks/capital-flow/usePredictions';
import { fetchCapitalFlowData } from '@/lib/api/capitalFlowApi';

const CapitalFlowPanel = () => {
  const [zoomLevel, setZoomLevel] = useState(80);
  const [chartTimeframe, setChartTimeframe] = useState('4h');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSidebarOnly, setShowSidebarOnly] = useState(false);

  const { data: flowData, isLoading, error } = useQuery({
    queryKey: ['capitalFlow', chartTimeframe],
    queryFn: () => fetchCapitalFlowData(chartTimeframe),
    refetchInterval: 30000,
  });

  const { processedFlowData } = useFilteredFlowData(flowData || [], activeCategory);
  const { filteredPredictions } = usePredictions(chartTimeframe);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Fixed Header - No margin/padding issues */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800/50">
        <FlowPanelHeader 
          chartTimeframe={chartTimeframe}
          onChartTimeframeChange={setChartTimeframe}
        />
        
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <CategoryFilters 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
          
          <FlowControls
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            chartTimeframe={chartTimeframe}
            onTimeframeChange={setChartTimeframe}
            showSidebarOnly={showSidebarOnly}
            onToggleSidebar={setShowSidebarOnly}
          />
          
          <ApiStatusIndicator isLoading={isLoading} error={error} />
        </div>
      </div>

      {/* Full Screen Main Content - Remove all constraining containers */}
      <div className="flex-1 relative overflow-hidden" style={{ margin: 0, padding: 0 }}>
        <FlowVisualizationContent
          isLoading={isLoading}
          error={error}
          processedFlowData={processedFlowData}
          zoomLevel={zoomLevel}
          filteredPredictions={filteredPredictions}
          chartTimeframe={chartTimeframe}
          activeCategory={activeCategory}
          showSidebarOnly={showSidebarOnly}
        />
      </div>
    </div>
  );
};

export default CapitalFlowPanel;
