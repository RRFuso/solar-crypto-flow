
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
  useEffect(() => {
    if (!config.flowData || config.flowData.length === 0 || !svgRef.current || !containerRef.current) return;

    const { width, height, narratives, flowData, isPredicted } = config;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
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

    // Set up simulation
    const { simulation, positionNodes, applyBounds, dragHandlers } = useSimulation({
      nodes,
      width,
      height
    });

    // Apply initial positioning
    positionNodes();

    // Use flow visualization hook to draw elements
    const { drawVisualization, updatePositions } = useFlowVisualization();
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

    // Add orbital paths (solar system like)
    const centralNode = nodes.find(n => n.name.toLowerCase().includes("bitcoin")) || 
                        nodes.reduce((max, n) => n.value > max.value ? n : max, nodes[0]);
    
    if (centralNode) {
      // Add subtle starfield background
      const starGroup = svg.append("g").attr("class", "starfield");
      const numStars = 100;
      
      for (let i = 0; i < numStars; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        const opacity = Math.random() * 0.5 + 0.2;
        
        starGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", size)
          .attr("fill", "white")
          .attr("opacity", opacity);
      }
    }

    return () => {
      simulation.stop();
      // Clean up animation frame if it exists
      if (elements.animationFrameId) {
        cancelAnimationFrame(elements.animationFrameId);
      }
    };
  }, [config, svgRef, containerRef]);
};
