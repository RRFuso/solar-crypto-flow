
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';
import { useMarketFlowAnimation } from '../hooks/useMarketFlowAnimation';

interface MarketFlowCoreProps {
  data: IndexRotationResult;
  width: number;
  height: number;
}

export const MarketFlowCore: React.FC<MarketFlowCoreProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const isInitializedRef = useRef(false);
  const { initializeVisualization, updateVisualization, cleanupAnimation } = useMarketFlowAnimation();
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Initialize only once, then update
    if (!isInitializedRef.current) {
      const animationFrameId = initializeVisualization(svgRef.current, data, width, height);
      isInitializedRef.current = true;
      
      return () => {
        cleanupAnimation(animationFrameId);
        isInitializedRef.current = false;
      };
    } else {
      // Update existing visualization
      updateVisualization(svgRef.current, data, width, height);
    }
  }, [data, width, height, initializeVisualization, updateVisualization, cleanupAnimation]);
  
  return (
    <svg 
      ref={svgRef} 
      className="w-full h-full" 
      style={{ background: 'linear-gradient(to bottom, #0a0f2c, #1a1a40)' }} 
    />
  );
};
