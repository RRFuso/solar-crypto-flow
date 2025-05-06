
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
    
    // Calculate net flow percentage for each node based on links
    filteredNodes.forEach(node => {
      // Skip central node
      if (node.id === centralNode.id) return;
      
      // Get all links involving this node
      const nodeLinks = filteredLinks.filter(
        link => link.source.id === node.id || link.target.id === node.id
      );
      
      // Calculate net flow
      let inflow = 0;
      let outflow = 0;
      
      nodeLinks.forEach(link => {
        if (link.target.id === node.id) {
          // This is an inflow
          inflow += Math.abs(link.value || 0);
        } else if (link.source.id === node.id) {
          // This is an outflow
          outflow += Math.abs(link.value || 0);
        }
      });
      
      // Calculate and store net flow percentage
      const totalFlow = inflow + outflow;
      if (totalFlow > 0) {
        // Set flow percentage between -100 and 100
        // Positive means net inflow, negative means net outflow
        node.flowPercentage = ((inflow - outflow) / totalFlow) * 100;
      } else {
        node.flowPercentage = 0;
      }
    });
    
    // Calculate orbit parameters
    const nonCentralNodes = filteredNodes.filter(n => n.id !== centralNode.id);
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10));
    
    // Apply zoom scale by modifying the base radius and scale factors
    const zoomFactor = zoomLevel / 100;
    const baseRadius = Math.min(width, height) * 0.25 / orbitLayers * zoomFactor;
    
    // Manually scale down node radii
    filteredNodes.forEach(node => {
      if (node.id === 'BTC') {
        node.radius = Math.max(30, node.radius * zoomFactor);
      } else {
        node.radius = Math.max(10, node.radius * zoomFactor);
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
    setVisualizationData(prev => ({ 
      nodes: filteredNodes, 
      links: filteredLinks, 
      centralNode,
      selectedNodeId: prev.selectedNodeId
    }));
    
    return () => {
      // Component cleanup
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization, setVisualizationData, animationRef, activeCategory]);
};
