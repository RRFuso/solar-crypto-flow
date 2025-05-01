
import { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { calculateNodePositions, OrbitalNode } from '../NodePlacement';

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
}

export const useVisualizationData = ({
  flowData,
  svgRef,
  dimensions,
  zoomLevel,
  setVisualizationData,
  animationRef,
  createOrbitalVisualization
}: UseVisualizationDataProps) => {
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !dimensions.width) return;
    
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
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = dimensions.width;
    const height = dimensions.height;
    
    // Initialize visualization
    const { svg, nodes, links, centralNode } = createOrbitalVisualization(
      flowData, 
      svgRef.current, 
      width,
      height
    );
    
    // Ensure we have nodes and links
    if (nodes.length === 0) {
      console.error("No nodes created from flow data");
      return;
    }
    
    // Calculate orbit parameters
    const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10));
    
    // Apply zoom scale by modifying the base radius and scale factors
    const zoomFactor = zoomLevel / 100; // Convert percent to factor (40% -> 0.4)
    const baseRadius = Math.min(width, height) * 0.25 / orbitLayers * zoomFactor;
    
    // Manually scale down node radii
    nodes.forEach(node => {
      if (node.id === 'BTC') {
        node.radius = Math.max(30 * zoomFactor, 15); // Minimum size for BTC
      } else {
        node.radius = Math.max(10 * zoomFactor, 5); // Minimum size for other nodes
      }
    });
    
    // Position nodes
    const nodePositionsProps = { nodes, centralNode, width, height, orbitLayers, baseRadius };
    calculateNodePositions(nodePositionsProps);
    
    // Make sure links reference the actual node objects
    links.forEach(link => {
      // Find source and target by ID if they're just strings
      if (typeof link.source === 'string') {
        const sourceNode = nodes.find(n => n.id === link.source);
        if (sourceNode) link.source = sourceNode;
      }
      
      if (typeof link.target === 'string') {
        const targetNode = nodes.find(n => n.id === link.target);
        if (targetNode) link.target = targetNode;
      }
    });
    
    // Add click handlers to highlight connections
    svg.selectAll(".node")
      .on("click", function(event, d) {
        // Toggle selection state
        setVisualizationData(prev => ({ 
          ...prev, 
          selectedNodeId: prev.selectedNodeId === d.id ? null : d.id 
        }));
      });
    
    // Store visualization data for rendering
    setVisualizationData(prev => ({ 
      nodes, 
      links, 
      centralNode,
      selectedNodeId: prev.selectedNodeId
    }));
    
    return () => {
      // Component cleanup
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef]);
};
