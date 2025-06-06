
import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals'; // Import PriceActionSignal

// Define ExtendedOrbitalNode here as well for consistency
interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;
  volume?: number | undefined; // Ensure volume is number or undefined
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
}

export const useVisualizationSetup = (flowData: FlowData[], zoomLevel: number = 70) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // CORRECTED: Use ExtendedOrbitalNode for the state type
  const [visualizationData, setVisualizationData] = useState<{
    nodes: ExtendedOrbitalNode[],
    links: any[],
    centralNode: ExtendedOrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  
  const animationRef = useRef<any | null>(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          // Ensure height is at least 700px or container height
          height: Math.max(700, containerRef.current.clientHeight || 0) 
        });
      }
    };
    
    handleResize(); // Initial sizing
    window.addEventListener('resize', handleResize);
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
    visualizationData, // State now uses ExtendedOrbitalNode
    setVisualizationData, // Setter function type matches the state
    animationRef,
    handleNodeSelection,
    createOrbitalVisualization
  };
};

