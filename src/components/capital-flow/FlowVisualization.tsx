
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useCapitalFlowVisualization } from '@/hooks/capital-flow/useCapitalFlowVisualization';

interface FlowVisualizationProps {
  flowData: FlowData[];
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ flowData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createVisualization } = useCapitalFlowVisualization();

  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    createVisualization(flowData, svgRef.current, containerRef.current);
    
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, createVisualization]);

  return (
    <div ref={containerRef} className="w-full flex-1">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
