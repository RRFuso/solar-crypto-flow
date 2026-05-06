
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
  const [renderEpoch, setRenderEpoch] = useState(0);
  
  const [visualizationData, setVisualizationData] = useState<{
    nodes: ExtendedOrbitalNode[],
    links: LinkData[],
    centralNode: ExtendedOrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  
  const animationRef = useRef<AnimationInstance | null>(null);
  
  // Handle window resize and initial sizing with robust detection
  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const updateDimensions = () => {
      if (!mounted || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions(prev => {
          if (prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
          return { width: Math.round(width), height: Math.round(height) };
        });
      }
    };

    // Aggressive initial sizing: poll via rAF until we get valid dimensions
    const pollForDimensions = () => {
      if (!mounted) return;
      updateDimensions();
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
          rafId = requestAnimationFrame(pollForDimensions);
          return;
        }
      }
    };
    pollForDimensions();

    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && mounted) {
            setDimensions(prev => {
              if (prev.width === Math.round(width) && prev.height === Math.round(height)) return prev;
              return { width: Math.round(width), height: Math.round(height) };
            });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateDimensions);
      resizeObserver?.disconnect();
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
