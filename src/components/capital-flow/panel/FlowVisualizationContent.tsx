
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
}

export const FlowVisualizationContent: React.FC<FlowVisualizationContentProps> = ({
  isLoading,
  error,
  processedFlowData,
  zoomLevel,
  filteredPredictions,
  chartTimeframe,
  activeCategory,
  showSidebarOnly = false
}) => {
  if (showSidebarOnly) {
    return (
      <div className="h-full w-full">
        <AIWatchlist 
          predictions={filteredPredictions} 
          maxItems={12} 
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
          <p className="text-slate-400">Loading solar system...</p>
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
    <div className="w-full h-full relative" style={{ margin: 0, padding: 0 }}>
      {/* Full Screen Solar System - No containers constraining width */}
      <FlowVisualization 
        flowData={processedFlowData} 
        zoomLevel={zoomLevel}
        predictions={filteredPredictions} 
        chartTimeframe={chartTimeframe}
        activeCategory={activeCategory}
      />
      
      {/* Legend positioned at bottom center, not interfering with main view */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <FlowLegend />
      </div>
    </div>
  );
};
