import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { CapitalFlowLink, LinkData } from '@/types/capitalFlow';

// Extend OrbitalNode to include necessary fields for tooltip
interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;
  volume?: number | undefined;
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
  aiModel?: AIInsight;
  capitalFlows?: CapitalFlowLink[];
}

interface UseVisualizationDataProps {
  flowData: FlowData[];
  cryptoDataMap: Map<string, CryptoData>;
  priceActionSignals: Map<string, PriceActionSignal> | null;
  aiInsights: Map<string, AIInsight>;
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number, height: number };
  zoomLevel: number;
  setVisualizationData: React.Dispatch<React.SetStateAction<{
    nodes: ExtendedOrbitalNode[];
    links: LinkData[];
    centralNode: ExtendedOrbitalNode | null;
    selectedNodeId: string | null;
  }>>;
  animationRef: React.MutableRefObject<any | null>;
  createOrbitalVisualization: (
    flowData: FlowData[],
    svgElement: SVGSVGElement,
    width: number,
    height: number
  ) => { svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: OrbitalNode[], links: LinkData[], centralNode: OrbitalNode | null };
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
  const baseRadius = isCentral ? 25 : 15;
  const zoomFactor = Math.min(1.5, Math.max(0.7, zoomLevel / 100));
  const calculatedRadius = baseRadius * zoomFactor;
  const minRadius = isCentral ? 20 : 12;
  const maxRadius = isCentral ? 35 : 22;
  return Math.max(minRadius, Math.min(maxRadius, calculatedRadius));
};

export const useVisualizationData = ({
  flowData,
  cryptoDataMap,
  priceActionSignals,
  aiInsights,
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

    const enrichedNodes: ExtendedOrbitalNode[] = baseNodes.map(node => {
      const cryptoInfo = cryptoDataMap.get(node.id);
      const signalInfo = priceActionSignals?.get(node.id);
      const aiModel = aiInsights.get(node.id);
      const capitalFlows = links.filter(link => link.source.id === node.id || link.target.id === node.id);

      return {
        ...node,
        price: cryptoInfo?.price,
        volume: getVolumeAsNumber(node.volume ?? cryptoInfo?.volume),
        priceChange24h: cryptoInfo?.priceChange24h,
        priceActionSignal: signalInfo,
        aiModel: aiModel,
        capitalFlows: capitalFlows,
      };
    });
    
    const enrichedCentralNode: ExtendedOrbitalNode | null = baseCentralNode ? {
        ...baseCentralNode,
        price: cryptoDataMap.get(baseCentralNode.id)?.price,
        volume: getVolumeAsNumber(baseCentralNode.volume ?? cryptoDataMap.get(baseCentralNode.id)?.volume),
        priceChange24h: cryptoDataMap.get(baseCentralNode.id)?.priceChange24h,
        priceActionSignal: priceActionSignals?.get(baseCentralNode.id),
        aiModel: aiInsights.get(baseCentralNode.id),
        capitalFlows: links.filter(link => link.source.id === baseCentralNode.id || link.target.id === baseCentralNode.id),
    } : null;

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

    filteredNodes.forEach(node => {
      const isCentral = node.id === filteredCentralNode?.id;
      node.radius = calculateConservativeRadius(node, zoomLevel, isCentral);
    });

    const nonCentralNodes = filteredNodes.filter(n => n.id !== filteredCentralNode?.id);
    const orbitLayers = Math.min(5, Math.ceil(nonCentralNodes.length / 8));
    const baseRadius = Math.min(width, height) * 0.2;

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
  }, [flowData, cryptoDataMap, priceActionSignals, aiInsights, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory, svgRef]); 
};