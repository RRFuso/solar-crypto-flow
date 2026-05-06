import { useEffect, useRef, useCallback } from 'react';
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
  onSvgCleared?: () => void;
}

const getVolumeAsNumber = (vol: number | string | undefined): number | undefined => {
    if (typeof vol === 'number') return vol;
    if (typeof vol === 'string') {
        const parsed = parseFloat(vol);
        return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
};

/**
 * Stable key for flowData to avoid unnecessary re-initializations.
 * Only changes when the actual set of symbols changes.
 */
const getFlowDataKey = (flowData: FlowData[]): string => {
  return flowData.map(f => (f as any).symbol || f.id || '').sort().join(',');
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
  onSvgCleared
}: UseVisualizationDataProps) => {
  // Track whether we've done the initial layout
  const initializedRef = useRef(false);
  const previousFlowKeyRef = useRef<string>('');
  const nodesRef = useRef<ExtendedOrbitalNode[]>([]);
  const linksRef = useRef<LinkData[]>([]);
  const centralNodeRef = useRef<ExtendedOrbitalNode | null>(null);

  // EFFECT 1: Only rebuild the layout when the set of symbols or dimensions change
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !dimensions.width) return;

    const flowKey = getFlowDataKey(flowData);
    const dimensionsChanged = true; // dimensions are in dep array

    // Only rebuild if the symbol set changed or first init
    if (initializedRef.current && flowKey === previousFlowKeyRef.current && !dimensionsChanged) {
      return;
    }

    // Clean up previous animation
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

    // Only clear SVG on first init or when symbols change
    if (!initializedRef.current || flowKey !== previousFlowKeyRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
      onSvgCleared?.();
    }

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

    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.2;
    const orbitLayers = Math.min(5, Math.ceil(enrichedNodes.filter(n => n.id !== enrichedCentralNode?.id).length / 8));

    calculateNodePositions({ 
      nodes: enrichedNodes, 
      centralNode: enrichedCentralNode, 
      width: dimensions.width, 
      height: dimensions.height, 
      orbitLayers, 
      baseRadius 
    });

    // Store refs for incremental updates
    nodesRef.current = enrichedNodes;
    linksRef.current = links;
    centralNodeRef.current = enrichedCentralNode;
    previousFlowKeyRef.current = flowKey;
    initializedRef.current = true;

    setVisualizationData({ 
      nodes: enrichedNodes, 
      links: links, 
      centralNode: enrichedCentralNode,
      selectedNodeId: null
    });

  // Only depend on structural changes - NOT on data that changes frequently
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowData, dimensions, createOrbitalVisualization, svgRef]);

  // EFFECT 2: Incrementally update node data (prices, signals, AI) without rebuilding layout
  useEffect(() => {
    if (!initializedRef.current || nodesRef.current.length === 0) return;

    const nodes = nodesRef.current;
    let changed = false;

    nodes.forEach(node => {
      const cryptoInfo = cryptoDataMaps.byId.get(node.id) || cryptoDataMaps.bySymbol.get(node.id.toUpperCase());
      const signalInfo = priceActionSignals?.get(node.id.toUpperCase());
      const aiModel = aiInsights.get(node.id.toUpperCase());

      if (cryptoInfo?.price?.toString() !== node.price) {
        node.price = cryptoInfo?.price?.toString() || 'N/A';
        node.priceChange24h = cryptoInfo?.priceChange24h;
        changed = true;
      }
      if (signalInfo !== node.priceActionSignal) {
        node.priceActionSignal = signalInfo;
        changed = true;
      }
      if (aiModel !== node.aiModel) {
        node.aiModel = aiModel;
        changed = true;
      }
    });

    if (changed) {
      // Trigger a re-render of NodeRenderer without rebuilding layout
      setVisualizationData(prev => ({
        ...prev,
        nodes: [...nodes], // shallow copy to trigger React update
      }));
    }
  }, [cryptoDataMaps, priceActionSignals, aiInsights, setVisualizationData]);
};
