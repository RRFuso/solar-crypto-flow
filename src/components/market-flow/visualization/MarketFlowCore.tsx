
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
  const { initializeVisualization, cleanupAnimation } = useMarketFlowAnimation();
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Initialize the visualization
    const animationFrameId = initializeVisualization(svgRef.current, data, width, height);
    
    // Cleanup on unmount
    return () => {
      cleanupAnimation(animationFrameId);
    };
  }, [data, width, height, initializeVisualization, cleanupAnimation]);
  
  return (
    <svg 
      ref={svgRef} 
      className="w-full h-full" 
      style={{ background: 'linear-gradient(to bottom, #0a0f2c, #1a1a40)' }} 
    />
  );
};
