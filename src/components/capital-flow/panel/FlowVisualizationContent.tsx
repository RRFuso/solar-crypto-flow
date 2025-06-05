
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
}

export const FlowVisualizationContent: React.FC<FlowVisualizationContentProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel,
  filteredPredictions,
  chartTimeframe,
  activeCategory
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
    <div className="flex gap-6 h-full" style={{ minHeight: "700px" }}>
      {/* AI Watchlist on the left - always show */}
      <div className="w-80 h-full flex-shrink-0">
        <AIWatchlist 
          predictions={filteredPredictions} 
          maxItems={8} 
          chartTimeframe={chartTimeframe}
        />
      </div>
      
      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* D3 Visualization with zoom level prop */}
        <FlowVisualization 
          flowData={processedFlowData} 
          zoomLevel={zoomLevel}
          predictions={filteredPredictions} 
          chartTimeframe={chartTimeframe}
          activeCategory={activeCategory}
        />
        
        {/* Legend */}
        <FlowLegend />
      </div>
    </div>
  );
};
