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
  activeCategory = 'all',
}: UseVisualizationDataProps) => {
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !dimensions.width) return;

    // Clean up animation
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

    // Clear SVG content
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create base visualization
    const { svg, nodes, links, centralNode } = createOrbitalVisualization(
      flowData,
      svgRef.current,
      width,
      height
    );

    if (nodes.length === 0) {
      console.error("No nodes created from flow data");
      return;
    }

    // Filter nodes by category if needed
    let filteredNodes = nodes;
    let filteredLinks = links;

    if (activeCategory !== 'all') {
      filteredNodes = nodes.filter(node => {
        if (node.id === centralNode.id) return true;
        return node.category === activeCategory ||
               (node.categories && node.categories.includes(activeCategory));
      });

      const filteredIds = filteredNodes.map(n => n.id);
      filteredLinks = links.filter(link =>
        filteredIds.includes(link.source.id) &&
        filteredIds.includes(link.target.id)
      );
    }

    // Apply zoom and calculate layout
    const zoomFactor = zoomLevel / 100;
    const nonCentralNodes = filteredNodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10));
    const baseRadius = Math.min(width, height) * 0.25 / orbitLayers * zoomFactor;

    filteredNodes.forEach(node => {
      node.radius = node.id === 'BTC'
        ? Math.max(30, node.radius * zoomFactor)
        : Math.max(10, node.radius * zoomFactor);
    });

    calculateNodePositions({
      nodes: filteredNodes,
      centralNode,
      width,
      height,
      orbitLayers,
      baseRadius
    });

    // ✅ Atribuir posição aos grupos visuais dos nós (essencial para overlay girar corretamente)
    svg.selectAll<SVGGElement, OrbitalNode>(".node-group")
      .data(filteredNodes, (d: any) => d.id)
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // ✅ Adicionar clique nos grupos
    svg.selectAll<SVGGElement, OrbitalNode>(".node-group")
      .on("click", function (event, d) {
        setVisualizationData(prev => ({
          ...prev,
          selectedNodeId: prev.selectedNodeId === d.id ? null : d.id
        }));
      });

    // Salvar dados atualizados
    setVisualizationData({
      nodes: filteredNodes,
      links: filteredLinks,
      centralNode,
      selectedNodeId: null
    });

    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [
    flowData,
    dimensions,
    zoomLevel,
    createOrbitalVisualization,
    setVisualizationData,
    animationRef,
    activeCategory
  ]);
};
