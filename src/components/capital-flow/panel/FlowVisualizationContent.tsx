
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
  showSidebarOnly?: boolean;
  showLines: boolean;
}

export const FlowVisualizationContent: React.FC<FlowVisualizationContentProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel,
  filteredPredictions,
  chartTimeframe,
  activeCategory,
  showSidebarOnly = false,
  showLines
}) => {
  if (showSidebarOnly) {
    return (
      <div className="h-full w-full">
        <AIWatchlist 
          maxItems={15} 
          chartTimeframe={chartTimeframe}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI-powered visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-400 bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="text-center">
          <p className="text-lg mb-2">⚠️ Failed to load market data</p>
          <p className="text-sm text-slate-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Main Orbital Visualization - Full container */}
      <FlowVisualization 
        flowData={processedFlowData} 
        zoomLevel={zoomLevel}
        predictions={filteredPredictions} 
        chartTimeframe={chartTimeframe}
        activeCategory={activeCategory}
        showLines={showLines}
      />
      
      {/* Legend positioned at bottom center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <FlowLegend />
      </div>
    </div>
  );
};
