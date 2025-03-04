
import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeData } from '@/types/narratives';

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
    
    // Create nodes for narratives
    const nodes: any[] = [];
    const uniqueNarratives = new Set();
    
    flowData.forEach(flow => {
      const sourceNarrative = narratives.find(n => n.id === flow.from);
      const targetNarrative = narratives.find(n => n.id === flow.to);
      
      if (!sourceNarrative || !targetNarrative) return;
      
      if (!uniqueNarratives.has(flow.from)) {
        uniqueNarratives.add(flow.from);
        nodes.push({ 
          id: flow.from,
          name: sourceNarrative.name,
          value: sourceNarrative.marketCap,
          color: sourceNarrative.color,
          tokens: sourceNarrative.tokens
        });
      }
      
      if (!uniqueNarratives.has(flow.to)) {
        uniqueNarratives.add(flow.to);
        nodes.push({ 
          id: flow.to,
          name: targetNarrative.name,
          value: targetNarrative.marketCap,
          color: targetNarrative.color,
          tokens: targetNarrative.tokens
        });
      }
    });

    // Scale node sizes
    const minRadius = 40;
    const maxRadius = 80;
    const marketCapExtent = d3.extent(nodes, d => d.value);
    
    nodes.forEach(node => {
      node.radius = marketCapExtent[0] === marketCapExtent[1] 
        ? minRadius 
        : d3.scaleLinear()
            .domain([marketCapExtent[0], marketCapExtent[1]])
            .range([minRadius, maxRadius])(node.value);
    });

    // Set up force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-1200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 40))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    // Create links
    const links = flowData.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage,
      predicted: flow.predicted
    }));

    // Draw visualization elements
    const drawVisualization = () => {
      // Draw links with arrows
      const linkGroup = svg.append("g").attr("class", "links");
      
      const link = linkGroup.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("stroke", d => isPredicted ? "#00ffaa" : "#ff00aa")
        .attr("stroke-width", d => {
          const maxFlow = d3.max(links, l => l.value) || 1;
          return 2 + (d.value / maxFlow) * 8;
        })
        .attr("fill", "none")
        .attr("stroke-dasharray", d => isPredicted ? "5,5" : "none")
        .attr("opacity", 0.7);

      // Add nodes
      const nodeGroup = svg.append("g").attr("class", "nodes");
      
      const node = nodeGroup.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      // Add node circles
      node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .attr("filter", "url(#glow)");

      // Add node labels
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", d => Math.min(d.radius * 0.4, 14))
        .text(d => d.name);

      // Add token names
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", d => d.radius + 15)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(d => d.tokens.slice(0, 3).join(", "));

      // Update positions on simulation tick
      simulation.on("tick", () => {
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });
    };

    // Create glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw the visualization
    drawVisualization();

    // Drag handlers
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [config, svgRef, containerRef]);
};
