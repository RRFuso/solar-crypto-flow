
import React from 'react';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { FlowVisualization } from '../FlowVisualization';
import { FlowLegend } from '../FlowLegend';
import AIWatchlist from '../../ai/AIWatchlist';

interface FlowVisualizationContentProps {
  isLoading: boolean;
  error: unknown;
  processedFlowData: FlowData[];
  zoomLevel: number;
  filteredPredictions: Prediction[];
  chartTimeframe: string;
  activeCategory: string;
  showFlowLines: boolean;
}

export const FlowVisualizationContent: React.FC<FlowVisualizationContentProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel,
  filteredPredictions,
  chartTimeframe,
  activeCategory,
  showFlowLines
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-neon-red">
        Failed to load market data
      </div>
    );
  }

  return (
    <div className="flex gap-6 flex-1 h-full overflow-hidden">
      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* D3 Visualization with zoom level prop */}
        <FlowVisualization 
          flowData={processedFlowData} 
          zoomLevel={zoomLevel}
          predictions={filteredPredictions} 
          chartTimeframe={chartTimeframe}
          activeCategory={activeCategory}
          showFlowLines={showFlowLines}
        />
        
        {/* Legend */}
        <FlowLegend />
      </div>
      
      {/* AI Watchlist Sidebar */}
      {filteredPredictions.length > 0 && (
        <div className="w-64 h-full overflow-auto">
          <AIWatchlist 
            predictions={filteredPredictions} 
            maxItems={8} 
            chartTimeframe={chartTimeframe}
          />
        </div>
      )}
    </div>
  );
};
