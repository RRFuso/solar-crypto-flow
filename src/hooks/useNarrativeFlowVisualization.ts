
import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeData } from '@/types/narratives';
import { useNodeSizing } from './narrative-flow/useNodeSizing';
import { useSimulation } from './narrative-flow/useSimulation';
import { useFlowVisualization } from './narrative-flow/useFlowVisualization';

interface VisualizationConfig {
  width: number;
  height: number;
  narratives: NarrativeData[];
  flowData: NarrativeFlow[];
  isPredicted: boolean;
}

export const useNarrativeFlowVisualization = (
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  config: VisualizationConfig
) => {
  const { width, height, narratives, flowData, isPredicted } = config;
  
  // Use our custom hooks to create and prepare nodes
  const { createNodes, scaleNodeSizes } = useNodeSizing(narratives);
  const nodes = createNodes(flowData);
  scaleNodeSizes(nodes);
  
  // Create links from flow data
  const links = flowData.map(flow => ({
    source: nodes.find(n => n.id === flow.from),
    target: nodes.find(n => n.id === flow.to),
    value: flow.value,
    percentage: flow.percentage,
    predicted: flow.predicted
  }));

  // Create a mock crypto data map for backward compatibility
  const cryptoDataMap = new Map();
  nodes.forEach(node => {
    cryptoDataMap.set(node.id, {
      marketCap: node.value || 0,
      price: 0,
      volume: 0,
      change24h: 0
    });
  });

  // Call useSimulation at the top level
  const { simulation, positionNodes, applyBounds, dragHandlers } = useSimulation({
    nodes,
    cryptoDataMap,
    width,
    height
  });

  // Use flow visualization hook to draw elements
  const { drawVisualization, updatePositions } = useFlowVisualization();

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const elements = drawVisualization({
      svg,
      nodes,
      links,
      isPredicted,
      dragHandlers
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      applyBounds();
      updatePositions(elements, nodes, links);
    });

    return () => {
      simulation.stop();
      // Clean up animation frame if it exists
      if (elements.animationFrameId) {
        cancelAnimationFrame(elements.animationFrameId);
      }
    };
  }, [config, svgRef, containerRef, simulation, positionNodes, applyBounds, dragHandlers, nodes, links]);
  
  // Helper function to create starfield background
  const createStarfield = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number, 
    height: number
  ) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 180; // Increased number of stars
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.1;
      const opacity = Math.random() * 0.6 + 0.1;
      
      // Create a star
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add subtle twinkle animation to some stars
      if (Math.random() > 0.7) {
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.4};${opacity}`)
          .attr("dur", `${2 + Math.random() * 6}s`)
          .attr("repeatCount", "indefinite");
      }
    }
    
    // Add subtle color variations to some stars
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      const opacity = Math.random() * 0.3 + 0.1;
      
      const colors = ["#f0f8ff", "#fffaf0", "#e6e6fa", "#f5f5dc"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", color)
        .attr("opacity", opacity);
    }
    
    // Add a few distant "galaxies" (blurred star clusters)
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const galaxySize = 30 + Math.random() * 60;
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", galaxySize)
        .attr("fill", "rgba(100, 100, 180, 0.02)")
        .attr("filter", "blur(12px)");
    }
  };
};
