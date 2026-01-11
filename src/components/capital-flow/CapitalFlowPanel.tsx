
import React, { memo } from 'react';
import FlowControls from './panel/FlowControls';
import SolarSystemSection from './panel/SolarSystemSection';
import SolarAnalystSection from './panel/SolarAnalystSection';
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
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden p-1 md:p-2 gap-1 md:gap-2 capital-flow-panel">
      {/* Main Content Area - Solar System */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-lg bg-slate-900/40 backdrop-blur-sm border border-slate-700/50">
        {/* Header Controls for Desktop */}
        <div className="hidden md:flex flex-shrink-0 border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm z-10">
          <div className="p-2 w-full">
            <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
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

        {/* Solar System Visualization */}
        <div className="flex-1 relative overflow-hidden">
          <SolarSystemSection
            flowData={processedFlowData}
            zoomLevel={zoomLevel}
            predictions={filteredPredictions}
            chartTimeframe={chartTimeframe}
            showLines={showLines}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Floating Chat - Solar Analyst (Separate section) */}
      <SolarAnalystSection isFloating={true} />
    </div>
  );
};

export default memo(CapitalFlowPanel);
