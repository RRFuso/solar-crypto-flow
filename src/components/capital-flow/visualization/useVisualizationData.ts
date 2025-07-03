
import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';

// Extend OrbitalNode to include necessary fields for tooltip
interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;
  volume?: number | undefined;
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
}

interface UseVisualizationDataProps {
  flowData: FlowData[];
  cryptoDataMap: Map<string, CryptoData>;
  priceActionSignals: Map<string, PriceActionSignal> | null;
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number, height: number };
  zoomLevel: number;
  setVisualizationData: React.Dispatch<React.SetStateAction<{
    nodes: ExtendedOrbitalNode[];
    links: any[];
    centralNode: ExtendedOrbitalNode | null;
    selectedNodeId: string | null;
  }>>;
  animationRef: React.MutableRefObject<any | null>;
  createOrbitalVisualization: (
    flowData: FlowData[],
    svgElement: SVGSVGElement,
    width: number,
    height: number
  ) => { svg: any, nodes: OrbitalNode[], links: any[], centralNode: OrbitalNode | null };
  activeCategory?: string;
}

// Helper function to safely parse volume to number
const getVolumeAsNumber = (vol: number | string | undefined): number | undefined => {
    if (typeof vol === 'number') return vol;
    if (typeof vol === 'string') {
        const parsed = parseFloat(vol);
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
};

// CRITICAL FIX: Conservative radius calculation
const calculateConservativeRadius = (node: OrbitalNode, zoomLevel: number, isCentral: boolean = false): number => {
  // Much more conservative base sizes
  const baseRadius = isCentral ? 25 : 15;
  
  // Minimal zoom impact
  const zoomFactor = Math.min(1.5, Math.max(0.7, zoomLevel / 100));
  
  // Calculate final radius with strict limits
  const calculatedRadius = baseRadius * zoomFactor;
  
  // STRICT LIMITS to prevent oversized nodes
  const minRadius = isCentral ? 20 : 12;
  const maxRadius = isCentral ? 35 : 22;
  
  return Math.max(minRadius, Math.min(maxRadius, calculatedRadius));
};

export const useVisualizationData = ({
  flowData,
  cryptoDataMap,
  priceActionSignals,
  svgRef,
  dimensions,
  zoomLevel,
  setVisualizationData,
  animationRef,
  createOrbitalVisualization,
  activeCategory = 'all'
}: UseVisualizationDataProps) => {
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !dimensions.width) return;

    if (animationRef.current) {
      try {
        if (typeof animationRef.current.cleanup === 'function') {
          animationRef.current.cleanup();
        }
      } catch (e) {
        console.error("Error cleaning up animation:", e);
      }
      animationRef.current = null;
    }

    d3.select(svgRef.current).selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create base visualization
    const { nodes: baseNodes, links, centralNode: baseCentralNode } = createOrbitalVisualization(
      flowData, 
      svgRef.current, 
      width,
      height
    );

    if (baseNodes.length === 0) {
      console.error("No nodes created from flow data");
      return;
    }

    // Enrich nodes with additional data
    const enrichedNodes: ExtendedOrbitalNode[] = baseNodes.map(node => {
      const cryptoInfo = cryptoDataMap.get(node.id);
      const signalInfo = priceActionSignals?.get(node.id);
      return {
        ...node,
        price: cryptoInfo?.price,
        volume: getVolumeAsNumber(node.volume ?? cryptoInfo?.volume),
        priceChange24h: cryptoInfo?.priceChange24h,
        priceActionSignal: signalInfo
      };
    });
    
    const enrichedCentralNode: ExtendedOrbitalNode | null = baseCentralNode ? {
        ...baseCentralNode,
        price: cryptoDataMap.get(baseCentralNode.id)?.price,
        volume: getVolumeAsNumber(baseCentralNode.volume ?? cryptoDataMap.get(baseCentralNode.id)?.volume),
        priceChange24h: cryptoDataMap.get(baseCentralNode.id)?.priceChange24h,
        priceActionSignal: priceActionSignals?.get(baseCentralNode.id)
    } : null;

    // Apply category filtering
    let filteredNodes = enrichedNodes;
    let filteredLinks = links;
    let filteredCentralNode = enrichedCentralNode;

    if (activeCategory !== 'all') {
      filteredNodes = enrichedNodes.filter(node => {
        if (node.id === enrichedCentralNode?.id) return true;
        const cryptoInfo = cryptoDataMap.get(node.id);
        return cryptoInfo?.category === activeCategory;
      });

      const filteredNodeIds = filteredNodes.map(node => node.id);
      filteredLinks = links.filter(link => 
        filteredNodeIds.includes(link.source.id) && 
        filteredNodeIds.includes(link.target.id)
      );
      
      if (enrichedCentralNode && !filteredNodes.find(n => n.id === enrichedCentralNode.id)) {
          filteredNodes.push(enrichedCentralNode);
      }
      if (!filteredNodeIds.includes(enrichedCentralNode?.id || '')) {
          filteredCentralNode = null;
      }
    }

    // CRITICAL FIX: Apply conservative radius calculations
    filteredNodes.forEach(node => {
      const isCentral = node.id === filteredCentralNode?.id;
      node.radius = calculateConservativeRadius(node, zoomLevel, isCentral);
    });

    // Calculate positioning with improved parameters
    const nonCentralNodes = filteredNodes.filter(n => n.id !== filteredCentralNode?.id);
    const orbitLayers = Math.min(5, Math.ceil(nonCentralNodes.length / 8)); // More conservative layer count
    const baseRadius = Math.min(width, height) * 0.2; // Reduced base radius

    const nodePositionsProps = { 
      nodes: filteredNodes, 
      centralNode: filteredCentralNode, 
      width, 
      height, 
      orbitLayers, 
      baseRadius 
    };
    
    calculateNodePositions(nodePositionsProps as any);

    setVisualizationData({ 
      nodes: filteredNodes, 
      links: filteredLinks, 
      centralNode: filteredCentralNode,
      selectedNodeId: null
    });

    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [flowData, cryptoDataMap, priceActionSignals, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory, svgRef]); 
};
