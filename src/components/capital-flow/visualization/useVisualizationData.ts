import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';

interface UseVisualizationDataProps {
  flowData: FlowData[];
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number; height: number };
  zoomLevel: number;
  setVisualizationData: React.Dispatch<React.SetStateAction<{
    nodes: OrbitalNode[];
    links: any[];
    centralNode: OrbitalNode | null;
    selectedNodeId: string | null;
  }>>;
  animationRef: React.MutableRefObject<any | null>;
  createOrbitalVisualization: (
    flowData: FlowData[],
    svgElement: SVGSVGElement,
    width: number,
    height: number
  ) => any;
  activeCategory?: string;
}

export const useVisualizationData = ({
  flowData,
  svgRef,
  dimensions,
  zoomLevel,
  setVisualizationData,
  animationRef,
  createOrbitalVisualization,
  activeCategory = 'all'
}: UseVisualizationDataProps) => {
  useEffect(() => {
    if (!flowData.length || !svgRef.current || !dimensions.width) return;

    if (animationRef.current?.cleanup) {
      animationRef.current.cleanup();
      animationRef.current = null;
    }

    d3.select(svgRef.current).selectAll("*").remove();

    const { svg, nodes, links, centralNode } = createOrbitalVisualization(
      flowData,
      svgRef.current,
      dimensions.width,
      dimensions.height
    );

    if (!nodes.length) return;

    const filteredNodes = activeCategory === 'all'
      ? nodes
      : nodes.filter(n => n.category === activeCategory || n.categories?.includes(activeCategory) || n.id === centralNode.id);

    const filteredLinks = links.filter(link =>
      filteredNodes.some(n => n.id === link.source.id) &&
      filteredNodes.some(n => n.id === link.target.id)
    );

    const baseRadius = (Math.min(dimensions.width, dimensions.height) * 0.25 / 8) * (zoomLevel / 100);

    filteredNodes.forEach(n => {
      n.radius = n.id === 'BTC'
        ? Math.max(30, n.radius * (zoomLevel / 100))
        : Math.max(10, n.radius * (zoomLevel / 100));
    });

    calculateNodePositions({
      nodes: filteredNodes,
      centralNode,
      width: dimensions.width,
      height: dimensions.height,
      orbitLayers: 8,
      baseRadius
    });

    setVisualizationData({
      nodes: filteredNodes,
      links: filteredLinks,
      centralNode,
      selectedNodeId: null
    });

  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory]);
};
