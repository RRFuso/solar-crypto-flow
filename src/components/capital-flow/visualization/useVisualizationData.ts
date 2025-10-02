import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData, CryptoData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { CapitalFlowLink, LinkData } from '@/types/capitalFlow';
import { ExtendedOrbitalNode } from '@/types/orbitalNodes';

interface UseVisualizationDataProps {
  flowData: FlowData[];
  cryptoDataMaps: {
    bySymbol: Map<string, CryptoData>;
    byId: Map<string, CryptoData>;
  };
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
  dataFullyLoaded: boolean;
}

const getVolumeAsNumber = (vol: number | string | undefined): number | undefined => {
    if (typeof vol === 'number') return vol;
    if (typeof vol === 'string') {
        const parsed = parseFloat(vol);
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
};

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
  cryptoDataMaps,
  priceActionSignals,
  aiInsights,
  svgRef,
  dimensions,
  zoomLevel,
  setVisualizationData,
  animationRef,
  createOrbitalVisualization,
  activeCategory = 'all',
  dataFullyLoaded
}: UseVisualizationDataProps) => {
  useEffect(() => {
    // Only create visualization once data is fully loaded
    if (!dataFullyLoaded) return;
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

    const { nodes: baseNodes, links, centralNode: baseCentralNode } = createOrbitalVisualization(
      flowData, 
      svgRef.current, 
      dimensions.width,
      dimensions.height
    );

    if (baseNodes.length === 0) {
      console.error("No nodes created from flow data");
      return;
    }

    const enrichedNodes: ExtendedOrbitalNode[] = baseNodes.map(node => {
      const cryptoInfo = cryptoDataMaps.byId.get(node.id) || cryptoDataMaps.bySymbol.get(node.id.toUpperCase());
      const signalInfo = priceActionSignals?.get(node.id.toUpperCase());
      const aiModel = aiInsights.get(node.id.toUpperCase());
      const capitalFlows = links.filter(link => link.source.id === node.id || link.target.id === node.id);
      
      const volume = getVolumeAsNumber(node.volume) || getVolumeAsNumber(cryptoInfo?.volume);

      return {
        ...node,
        name: cryptoInfo?.name || node.id,
        value: volume || 0,
        color: '#3b82f6',
        tokens: [],
        fx: null,
        fy: null,
        price: cryptoInfo?.price?.toString() || 'N/A',
        volume: volume,
        priceChange24h: cryptoInfo?.priceChange24h,
        priceActionSignal: signalInfo,
        aiModel: aiModel,
        capitalFlows: capitalFlows,
      };
    });
    
    const enrichedCentralNode: ExtendedOrbitalNode | null = baseCentralNode ? {
        ...baseCentralNode,
        name: cryptoDataMaps.byId.get(baseCentralNode.id)?.name || baseCentralNode.id,
        value: 0,
        color: '#3b82f6',
        tokens: [],
        fx: null,
        fy: null,
        price: cryptoDataMaps.byId.get(baseCentralNode.id)?.price?.toString() || 'N/A',
        volume: getVolumeAsNumber(baseCentralNode.volume ?? cryptoDataMaps.byId.get(baseCentralNode.id)?.volume),
        priceChange24h: cryptoDataMaps.byId.get(baseCentralNode.id)?.priceChange24h,
        priceActionSignal: priceActionSignals?.get(baseCentralNode.id.toUpperCase()),
        aiModel: aiInsights.get(baseCentralNode.id.toUpperCase()),
        capitalFlows: links.filter(link => link.source.id === baseCentralNode.id || link.target.id === baseCentralNode.id),
    } : null;

    enrichedNodes.forEach(node => {
      const isCentral = node.id === enrichedCentralNode?.id;
      node.radius = calculateConservativeRadius(node, zoomLevel, isCentral);
    });

    calculateNodePositions({ 
      nodes: enrichedNodes, 
      centralNode: enrichedCentralNode, 
      width: dimensions.width, 
      height: dimensions.height, 
      orbitLayers: Math.min(5, Math.ceil(enrichedNodes.filter(n => n.id !== enrichedCentralNode?.id).length / 8)), 
      baseRadius: Math.min(dimensions.width, dimensions.height) * 0.2 
    });

    setVisualizationData({ 
      nodes: enrichedNodes, 
      links: links, 
      centralNode: enrichedCentralNode,
      selectedNodeId: null
    });

  }, [flowData, dimensions.width, dimensions.height, zoomLevel, activeCategory, dataFullyLoaded, svgRef, createOrbitalVisualization, setVisualizationData, animationRef]);
};
