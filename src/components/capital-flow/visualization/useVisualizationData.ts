
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
    // Only proceed if we have data, an SVG element, and dimensions
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
    
    // Initialize visualization immediately with the default timeframe
    console.log("Initializing visualization with default timeframe");
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
    
    // Apply category filtering
    let filteredNodes = nodes;
    let filteredLinks = links;
    
    if (activeCategory !== 'all') {
      // Filter nodes by category
      filteredNodes = nodes.filter(node => {
        // Keep central node
        if (node.id === centralNode.id) return true;
        
        // Check if node has this category
        return node.category === activeCategory || 
               (node.categories && node.categories.includes(activeCategory));
      });
      
      // Get IDs of filtered nodes
      const filteredNodeIds = filteredNodes.map(node => node.id);
      
      // Filter links to only include connections between filtered nodes
      filteredLinks = links.filter(link => 
        filteredNodeIds.includes(link.source.id) && 
        filteredNodeIds.includes(link.target.id)
      );
    }
    
    // Calculate orbit parameters with dynamic scaling
    const nonCentralNodes = filteredNodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10));
    
    // Dynamic base radius calculation based on container size and zoom
    const minDimension = Math.min(width, height);
    const zoomFactor = zoomLevel / 100;
    const baseRadius = (minDimension * 0.12 / orbitLayers) * zoomFactor; // Adjusted for better fit
    
    // Scale node radii dynamically
    filteredNodes.forEach(node => {
      const sizeScale = Math.max(0.6, Math.min(1.4, minDimension / 800)); // Responsive sizing
      if (node.id === 'BTC') {
        node.radius = Math.max(20, node.radius * zoomFactor * sizeScale);
      } else {
        node.radius = Math.max(8, node.radius * zoomFactor * sizeScale);
      }
    });
    
    // Position nodes
    const nodePositionsProps = { 
      nodes: filteredNodes, 
      centralNode, 
      width, 
      height, 
      orbitLayers, 
      baseRadius 
    };
    calculateNodePositions(nodePositionsProps);
    
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
    setVisualizationData({ 
      nodes: filteredNodes, 
      links: filteredLinks, 
      centralNode,
      selectedNodeId: null
    });
    
    return () => {
      // Component cleanup
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory]);
};
