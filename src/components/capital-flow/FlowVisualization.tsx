
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useOrbitalVisualization } from '@/hooks/capital-flow/useOrbitalVisualization';
import { OrbitLayersComponent } from './OrbitLayers';
import { NodePlacementComponent, calculateNodePositions, OrbitalNode } from './NodePlacement';
import { LinkRendererComponent } from './LinkRenderer';
import { NodeRendererComponent } from './NodeRenderer';
import { OrbitalAnimationComponent } from './OrbitalAnimation';

interface FlowVisualizationProps {
  flowData: FlowData[];
  zoomLevel?: number;
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ 
  flowData, 
  zoomLevel = 70 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createOrbitalVisualization } = useOrbitalVisualization();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [visualizationData, setVisualizationData] = useState<{
    nodes: OrbitalNode[],
    links: any[],
    centralNode: OrbitalNode | null,
    selectedNodeId: string | null
  }>({ nodes: [], links: [], centralNode: null, selectedNodeId: null });
  const animationRef = useRef<any | null>(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(700, containerRef.current.clientHeight) // Increased minimum height
        });
      }
    };
    
    // Initial sizing
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
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
    
    // Add starfield background
    createStarfield(d3.select(svgRef.current), width, height);
    
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
    const orbitLayers = Math.min(10, Math.ceil(nonCentralNodes.length / 10)); // More orbit layers for more nodes
    
    // Apply zoom scale by modifying the base radius and scale factors
    const zoomFactor = zoomLevel / 100;
    const baseRadius = Math.min(width, height) * 0.25 / orbitLayers * zoomFactor;
    
    // Manually scale down node radii
    nodes.forEach(node => {
      if (node.id === 'BTC') {
        node.radius = Math.max(30, node.radius * zoomFactor);
      } else {
        node.radius = Math.max(10, node.radius * zoomFactor);
      }
    });
    
    // Position nodes
    const nodePositionsProps = { nodes, centralNode, width, height, orbitLayers, baseRadius };
    calculateNodePositions(nodePositionsProps);
    
    // Add click handlers to highlight connections
    svg.selectAll(".node")
      .on("click", function(event, d) {
        // Toggle selection state
        if (visualizationData.selectedNodeId === d.id) {
          setVisualizationData(prev => ({ ...prev, selectedNodeId: null }));
        } else {
          setVisualizationData(prev => ({ ...prev, selectedNodeId: d.id }));
        }
      });
    
    // Store visualization data for rendering
    setVisualizationData({ 
      nodes, 
      links, 
      centralNode,
      selectedNodeId: visualizationData.selectedNodeId
    });
    
    // Render visualization components
    return () => {
      // Component cleanup
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, dimensions, zoomLevel, createOrbitalVisualization]);

  // Function to create starfield
  const createStarfield = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 250; // Increased stars for better background effect
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.2;
      const opacity = Math.random() * 0.5 + 0.2;
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add twinkling effect to some stars
      if (Math.random() > 0.7) {
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.5};${opacity}`)
          .attr("dur", `${2 + Math.random() * 4}s`)
          .attr("repeatCount", "indefinite");
      }
    }
    
    // Add a few distant "galaxies" (blurred star clusters)
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const galaxySize = 20 + Math.random() * 40;
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", galaxySize)
        .attr("fill", "rgba(100, 100, 150, 0.02)")
        .attr("filter", "blur(8px)");
    }
  };

  if (!flowData || flowData.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" style={{ minHeight: "700px" }}>
        <p className="text-gray-400">No flow data available</p>
      </div>
    );
  }

  // Only render the visualization components if we have the SVG and data
  const renderVisualization = svgRef.current && dimensions.width > 0 && visualizationData.nodes.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: "700px" }}>
      <svg ref={svgRef} className="w-full h-full" />
      {renderVisualization && svgRef.current && (
        <>
          <OrbitLayersComponent 
            svg={d3.select(svgRef.current)}
            width={dimensions.width}
            height={dimensions.height}
            orbitLayers={8}
            baseRadius={30 * (zoomLevel / 100)} // Apply zoom to orbit radius
            extendFullScreen={true} // Extend orbit lines to full screen
          />
          <LinkRendererComponent 
            svg={d3.select(svgRef.current)}
            links={visualizationData.links}
            selectedNodeId={visualizationData.selectedNodeId}
          />
          <NodeRendererComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            centralNode={visualizationData.centralNode}
            selectedNodeId={visualizationData.selectedNodeId}
          />
          <OrbitalAnimationComponent 
            svg={d3.select(svgRef.current)}
            nodes={visualizationData.nodes}
            width={dimensions.width}
            height={dimensions.height}
          />
        </>
      )}
    </div>
  );
};
