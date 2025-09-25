
import React from 'react';
import { FlowPanelHeader } from './panel/FlowPanelHeader';
import { FlowControls } from './panel/FlowControls';
import { FlowVisualizationContent } from './panel/FlowVisualizationContent';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';

interface CapitalFlowPanelProps {
  isLoading: boolean;
  error: unknown;
  processedFlowData: FlowData[];
  zoomLevel: number;
  filteredPredictions: Prediction[];
  chartTimeframe: string;
  activeCategory: string;
  showLines: boolean;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  flowLimit: number;
  handleLimitChange: (value: number[]) => void;
  handleChartTimeframeChange: (value: string) => void;
  showOnlyStrongSignals: boolean;
  setShowOnlyStrongSignals: (value: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  refetch: () => void;
  setShowLines: (value: boolean) => void;
}

const CapitalFlowPanel: React.FC<CapitalFlowPanelProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel,
  filteredPredictions,
  chartTimeframe,
  activeCategory,
  showLines,
  handleZoomIn,
  handleZoomOut,
  flowLimit,
  handleLimitChange,
  handleChartTimeframeChange,
  showOnlyStrongSignals,
  setShowOnlyStrongSignals,
  selectedCategory,
  setSelectedCategory,
  refetch,
  setShowLines,
}) => {
  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden p-1 md:p-4 gap-1 md:gap-4 capital-flow-panel">
      {/* Left Sidebar - AI Watchlist */}
      <div className="w-full md:w-96 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/40 backdrop-blur-sm rounded-lg overflow-hidden capital-flow-sidebar">
        <FlowVisualizationContent 
          isLoading={isLoading}
          error={error}
          processedFlowData={processedFlowData}
          zoomLevel={zoomLevel}
          filteredPredictions={filteredPredictions}
          chartTimeframe={chartTimeframe}
          activeCategory={activeCategory}
          showSidebarOnly={true}
          showLines={showLines}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-lg capital-flow-main">
        {/* Header Controls for Desktop */}
        <div className="hidden md:flex flex-shrink-0 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm z-10">
          <div className="p-3 w-full">
            <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
              <div>
                <FlowControls
                  chartTimeframe={chartTimeframe}
                  onChartTimeframeChange={handleChartTimeframeChange}
                  showOnlyStrongSignals={showOnlyStrongSignals}
                  setShowOnlyStrongSignals={setShowOnlyStrongSignals}
                  zoomLevel={zoomLevel}
                  handleZoomIn={handleZoomIn}
                  handleZoomOut={handleZoomOut}
                  flowLimit={flowLimit}
                  handleLimitChange={handleLimitChange}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onRefresh={refetch}
                  showLines={showLines}
                  setShowLines={setShowLines}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div className="flex-1 relative overflow-hidden">
          <FlowVisualizationContent 
            isLoading={isLoading}
            error={error}
            processedFlowData={processedFlowData}
            zoomLevel={zoomLevel}
            filteredPredictions={filteredPredictions}
            chartTimeframe={chartTimeframe}
            activeCategory={activeCategory}
            showSidebarOnly={false}
            showLines={showLines}
          />
        </div>
      </div>
    </div>
  );
};

export default CapitalFlowPanel;
