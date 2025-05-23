import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../components/capital-flow/NodePlacement';

interface UseVisualizationDataProps {
  flowData: FlowData[];
  svgRef: React.RefObject<SVGSVGElement>;
  dimensions: { width: number, height: number };
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
    }
    animationRef.current = null;

    d3.select(svgRef.current).selectAll("*").remove();

    const { svg, nodes, links, centralNode } = createOrbitalVisualization(
      flowData,
      svgRef.current,
      dimensions.width,
      dimensions.height
    );

    if (!nodes.length) return;

    let filteredNodes = nodes;
    let filteredLinks = links;

    if (activeCategory !== 'all') {
      filteredNodes = nodes.filter(n => n.id === centralNode.id || n.category === activeCategory);
      const ids = filteredNodes.map(n => n.id);
      filteredLinks = links.filter(l => ids.includes(l.source.id) && ids.includes(l.target.id));
    }

    const orbitLayers = Math.min(10, Math.ceil(filteredNodes.length / 10));
    const zoomFactor = zoomLevel / 100;
    const baseRadius = Math.min(dimensions.width, dimensions.height) * 0.25 / orbitLayers * zoomFactor;

    filteredNodes.forEach(node => {
      node.radius = node.id === 'BTC' ? Math.max(30, node.radius * zoomFactor) : Math.max(10, node.radius * zoomFactor);
    });

    calculateNodePositions({ nodes: filteredNodes, centralNode, width: dimensions.width, height: dimensions.height, orbitLayers, baseRadius });

    svg.selectAll(".node")
      .on("click", function (event, d) {
        setVisualizationData(prev => ({
          ...prev,
          selectedNodeId: prev.selectedNodeId === d.id ? null : d.id
        }));
      });

    setVisualizationData({
      nodes: filteredNodes,
      links: filteredLinks,
      centralNode,
      selectedNodeId: null
    });

    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory]);
};
