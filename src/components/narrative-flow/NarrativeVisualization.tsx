
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow } from '@/types/narratives';
import { useNarrativeFlowVisualization } from '@/hooks/useNarrativeFlowVisualization';
import { getNarratives, getMarketAttentionData } from '@/lib/narrativeData';
import { TrendingUp, Coins, TrendingDown, FileBarChart, Bitcoin } from 'lucide-react';

interface NarrativeVisualizationProps {
  flowData: NarrativeFlow[];
  usePredictions: boolean;
  predictionConfidence?: number;
}

export const NarrativeVisualization: React.FC<NarrativeVisualizationProps> = ({
  flowData,
  usePredictions,
  predictionConfidence
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const narratives = getNarratives();
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const { topNarratives } = getMarketAttentionData();

  // Update dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        // Apply 80% zoom for the visualization
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = 500; // Base height
        
        setDimensions({
          width: containerWidth * 0.8,  // 80% zoom
          height: containerHeight * 0.8 // 80% zoom
        });
      }
    };
    
    updateDimensions();
    
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useNarrativeFlowVisualization(svgRef, containerRef, {
    width: dimensions.width,
    height: dimensions.height,
    narratives,
    flowData,
    isPredicted: usePredictions
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      {usePredictions && predictionConfidence && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 px-3 py-1 rounded-lg text-xs text-white/90 border border-white/10">
          LSTM Model: {Math.round(predictionConfidence * 100)}% confidence
        </div>
      )}
      
      {/* Market attention panel */}
      <div className="absolute top-2 left-2 bg-gradient-to-r from-gray-900/80 to-black/50 px-4 py-2 rounded-lg text-xs text-white/90 border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <FileBarChart className="h-4 w-4 text-purple-400" />
          <span className="font-medium">Top Narratives by Market Attention</span>
        </div>
        <div className="space-y-1">
          {topNarratives.map((narrative, index) => (
            <div key={narrative.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: narrative.color }}></div>
              <span>{narrative.name}</span>
              <span 
                className={narrative.change24h >= 0 ? "text-green-400" : "text-red-400"}
              >
                {narrative.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 inline" />
                ) : (
                  <TrendingDown className="h-3 w-3 inline" />
                )}
                {narrative.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div ref={containerRef} className="w-full flex-1 flex justify-center">
        <div className="relative" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}>
          <svg ref={svgRef} className="w-full h-full" />
          
          {/* Add orbital paths visualization */}
          {svgRef.current && dimensions.width > 0 && (
            <>
              {/* Orbital circles are added by the useNarrativeFlowVisualization hook */}
            </>
          )}
        </div>
      </div>
      
      {/* Enhanced legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 p-2 bg-black/20 rounded-lg text-sm text-white/80">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-4 w-4 text-[#F7931A]" />
          <span>Bitcoin Narrative (Central)</span>
        </div>
        
        {usePredictions ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00ffaa]"></div>
              <span>Predicted Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span>LSTM Prediction Model</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff00aa]"></div>
            <span>Historical Flow</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-white/80" />
          <span>Node Size = Market Cap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span>Market Attention</span>
        </div>
      </div>
    </div>
  );
};
