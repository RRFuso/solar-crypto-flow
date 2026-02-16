
import React, { memo } from 'react';
import SolarSystemSection from './panel/SolarSystemSection';
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
  showLines,
  handleZoomIn,
  handleZoomOut,
  flowLimit,
  handleLimitChange,
  handleChartTimeframeChange,
  refetch,
  setShowLines,
}) => {
  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden p-1 md:p-2 gap-1 md:gap-2 capital-flow-panel">
      {/* Main Content Area - Solar System */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-lg bg-slate-900/40 backdrop-blur-sm border border-slate-700/50">
        {/* Solar System Visualization - controls are now inside SolarSystemSection */}
        <div className="flex-1 relative overflow-hidden">
          <SolarSystemSection
            flowData={processedFlowData}
            zoomLevel={zoomLevel}
            predictions={filteredPredictions}
            chartTimeframe={chartTimeframe}
            showLines={showLines}
            isLoading={isLoading}
            error={error}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onTimeframeChange={handleChartTimeframeChange}
            onRefresh={refetch}
            onShowLinesChange={setShowLines}
            flowLimit={flowLimit}
            onFlowLimitChange={handleLimitChange}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(CapitalFlowPanel);
