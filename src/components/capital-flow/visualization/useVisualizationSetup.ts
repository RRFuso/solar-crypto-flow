
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitalNode } from '../NodePlacement';

export const useVisualizationSetup = (flowData: FlowData[], zoomLevel: number = 70) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visualizationData, setVisualizationData] = useState<{
    nodes: OrbitalNode[],
    links: any[],
    centralNode: OrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  const animationRef = useRef<any | null>(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(700, containerRef.current.clientHeight)
        });
      }
    };
    
    // Initial sizing
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Select a node to highlight its connections
  const handleNodeSelection = (nodeId: string | null) => {
    setVisualizationData(prev => ({ 
      ...prev, 
      selectedNodeId: prev.selectedNodeId === nodeId ? null : nodeId 
    }));
  };
  
  return {
    svgRef,
    containerRef,
    dimensions,
    visualizationData,
    setVisualizationData,
    animationRef,
    handleNodeSelection,
    createOrbitalVisualization
  };
};
