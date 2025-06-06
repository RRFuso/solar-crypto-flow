
import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto'; // Import CryptoData
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals'; // Import PriceActionSignal

// Extend OrbitalNode to include necessary fields for tooltip
// Ensure volume type matches OrbitalNode (number | undefined)
interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;
  volume?: number | undefined; // CORRECTED: Ensure volume is number or undefined
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
}

interface UseVisualizationDataProps {
  flowData: FlowData[];
  cryptoDataMap: Map<string, CryptoData>; // Add map for quick lookup
  priceActionSignals: Map<string, PriceActionSignal> | null; // Add signals map
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number, height: number };
  zoomLevel: number;
  setVisualizationData: React.Dispatch<React.SetStateAction<{
    nodes: ExtendedOrbitalNode[]; // Use extended type here
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
  ) => { svg: any, nodes: OrbitalNode[], links: any[], centralNode: OrbitalNode | null }; // Define return type
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

export const useVisualizationData = ({
  flowData,
  cryptoDataMap, // Receive crypto data map
  priceActionSignals, // Receive signals map
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

    // Create base visualization (nodes might lack extra data here initially)
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

    // --- Enrich nodes with Price, Volume, Change24h, and Signals --- 
    const enrichedNodes: ExtendedOrbitalNode[] = baseNodes.map(node => {
      const cryptoInfo = cryptoDataMap.get(node.id);
      const signalInfo = priceActionSignals?.get(node.id);
      return {
        ...node,
        price: cryptoInfo?.price,
        // CORRECTED: Ensure volume is parsed to number
        volume: getVolumeAsNumber(node.volume ?? cryptoInfo?.volume), 
        priceChange24h: cryptoInfo?.priceChange24h,
        priceActionSignal: signalInfo
      };
    });
    
    const enrichedCentralNode: ExtendedOrbitalNode | null = baseCentralNode ? {
        ...baseCentralNode,
        price: cryptoDataMap.get(baseCentralNode.id)?.price,
        // CORRECTED: Ensure volume is parsed to number
        volume: getVolumeAsNumber(baseCentralNode.volume ?? cryptoDataMap.get(baseCentralNode.id)?.volume),
        priceChange24h: cryptoDataMap.get(baseCentralNode.id)?.priceChange24h,
        priceActionSignal: priceActionSignals?.get(baseCentralNode.id)
    } : null;
    // --- End Enrichment --- 

    // Apply category filtering to enriched nodes
    let filteredNodes = enrichedNodes;
    let filteredLinks = links;
    let filteredCentralNode = enrichedCentralNode;

    if (activeCategory !== 'all') {
      filteredNodes = enrichedNodes.filter(node => {
        if (node.id === enrichedCentralNode?.id) return true;
        const cryptoInfo = cryptoDataMap.get(node.id);
        // Assuming category is fetched and available in cryptoInfo
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

    const nonCentralNodes = filteredNodes.filter(n => n.id !== filteredCentralNode?.id);
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10));
    const zoomFactor = zoomLevel / 100;
    const baseRadius = Math.min(width, height) * 0.25 / orbitLayers * zoomFactor;

    filteredNodes.forEach(node => {
      const baseRad = node.id === filteredCentralNode?.id ? 30 : 15;
      node.radius = Math.max(10, baseRad * zoomFactor * 1.5);
    });

    const nodePositionsProps = { 
      nodes: filteredNodes, 
      centralNode: filteredCentralNode, 
      width, 
      height, 
      orbitLayers, 
      baseRadius 
    };
    // Ensure calculateNodePositions accepts ExtendedOrbitalNode[] or handle type mismatch
    calculateNodePositions(nodePositionsProps as any); // Using 'as any' temporarily if types mismatch, ideally fix the function signature

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