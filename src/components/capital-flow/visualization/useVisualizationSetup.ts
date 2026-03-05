
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { LinkData } from '@/types/capitalFlow';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';

import { ExtendedOrbitalNode } from '@/types/orbitalNodes';

interface AnimationInstance {
  cleanup: () => void;
}

export const useVisualizationSetup = (flowData: FlowData[], zoomLevel: number = 70) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const [visualizationData, setVisualizationData] = useState<{
    nodes: ExtendedOrbitalNode[],
    links: LinkData[],
    centralNode: ExtendedOrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  
  const animationRef = useRef<AnimationInstance | null>(null);
  
  // Handle window resize and initial sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Only update if we get real dimensions (not 0)
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    };
    
    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef.current) {
      // Immediate dimension capture
      updateDimensions();
      
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setDimensions({ width, height });
          }
        }
      });
      
      resizeObserver.observe(containerRef.current);
    }
    
    // Double-check with a small delay to ensure layout is complete
    const timeoutId = setTimeout(updateDimensions, 50);
    
    // Fallback to window resize listener
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
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
