
import React, { useEffect, useRef } from 'react';
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
    
    // Clear previous SVG content using native DOM methods
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
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
