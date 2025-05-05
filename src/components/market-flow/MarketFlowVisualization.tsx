
import React, { useRef, useEffect, useState } from 'react';
import { IndexRotationResult } from '@/types/indices';
import { MarketFlowCore } from './visualization/MarketFlowCore';

interface MarketFlowVisualizationProps {
  data: IndexRotationResult;
}

export const MarketFlowVisualization: React.FC<MarketFlowVisualizationProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 350 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial dimensions
    setDimensions({
      width: containerRef.current.clientWidth,
      height: 350
    });
    
    // Update dimensions on window resize
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 350
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div ref={containerRef} className="w-full flex-1">
      {dimensions.width > 0 && (
        <MarketFlowCore 
          data={data} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
    </div>
  );
};
