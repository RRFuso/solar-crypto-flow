
import React, { useRef, useEffect, useState } from 'react';
import { NarrativeFlow } from '@/types/narratives';
import { useNarrativeFlowVisualization } from '@/hooks/useNarrativeFlowVisualization';
import { getNarratives } from '@/lib/narrativeData';
import { TrendingUp, Coins } from 'lucide-react';

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
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Update dimensions when container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 400
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
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 px-3 py-1 rounded-lg text-xs text-white/90 border border-white/10">
          LSTM Model: {Math.round(predictionConfidence * 100)}% confidence
        </div>
      )}
      
      <div ref={containerRef} className="w-full flex-1">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/80">
        {usePredictions ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00ffaa]"></div>
              <span>Predicted Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span>LSTM TensorFlow.js Model</span>
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
          <span>Drag nodes to reposition</span>
        </div>
      </div>
    </div>
  );
};
