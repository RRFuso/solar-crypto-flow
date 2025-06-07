
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';

interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;
  volume?: number | undefined;
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
}

export const useVisualizationSetup = (flowData: FlowData[], zoomLevel: number = 70) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const [visualizationData, setVisualizationData] = useState<{
    nodes: ExtendedOrbitalNode[],
    links: any[],
    centralNode: ExtendedOrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  
  const animationRef = useRef<any | null>(null);
  
  // Enhanced resize handling with improved timing
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      if (containerRef.current) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const rect = containerRef.current!.getBoundingClientRect();
          const width = Math.max(rect.width, 400);
          const height = Math.max(rect.height, 400);
          
          console.log('Setting dimensions:', { width, height });
          setDimensions({ width, height });
        }, 50); // Debounce resize events
      }
    };
    
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            const finalWidth = Math.max(width, 400);
            const finalHeight = Math.max(height, 400);
            console.log('ResizeObserver setting dimensions:', { width: finalWidth, height: finalHeight });
            setDimensions({ width: finalWidth, height: finalHeight });
          }, 50);
        }
      });
      
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial size calculation with delay
    const initialTimer = setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialTimer);
      clearTimeout(resizeTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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
