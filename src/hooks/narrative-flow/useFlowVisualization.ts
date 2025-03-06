
import { RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeNode } from '@/types/narratives';

interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: any[];
  isPredicted: boolean;
  dragHandlers: any;
}

export const useFlowVisualization = () => {
  // Create visual elements for the flow visualization
  const drawVisualization = (options: DrawOptions) => {
    const { svg, nodes, links, isPredicted, dragHandlers } = options;
    
    // Create defs for logos and glows
    const defs = svg.append("defs");
    
    // Create glow filter
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
    
    // Draw links with curved paths
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
      .attr("stroke-dasharray", "10,10") // Dashed lines
      .attr("opacity", 0.7);

    // Add animated particles for flow visualization
    links.forEach((link, i) => {
      const particles = 3;
      for (let j = 0; j < particles; j++) {
        const particle = svg.append("circle")
          .attr("r", 3)
          .attr("fill", isPredicted ? "#00ffaa" : "#ff00aa")
          .attr("class", "flow-particle")
          .attr("opacity", 0.8);
          
        // Create animated flow effect
        particle.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0;1;0")
          .attr("dur", "4s")
          .attr("repeatCount", "indefinite")
          .attr("begin", `${j * 1.3}s`); // Stagger animations
      }
    });

    // Add nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragHandlers.dragstarted)
        .on("drag", dragHandlers.dragged)
        .on("end", dragHandlers.dragended));

    // Add node circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7)
      .attr("filter", "url(#glow)");

    // Add crypto logos in circles
    node.each(function(d) {
      const mainToken = d.tokens[0] || "";
      
      // Add circular clip path for logo
      const clipId = `clip-${d.id}`;
      defs.append("clipPath")
        .attr("id", clipId)
        .append("circle")
        .attr("r", d.radius * 0.5);
      
      // Add logo as image
      d3.select(this)
        .append("image")
        .attr("href", `https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579`.replace("bitcoin", mainToken.toLowerCase()))
        .attr("width", d.radius)
        .attr("height", d.radius)
        .attr("x", -d.radius * 0.5)
        .attr("y", -d.radius * 0.5)
        .attr("clip-path", `url(#${clipId})`)
        .attr("preserveAspectRatio", "xMidYMid slice");
    });

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
      .text(d => d.tokens.slice(0, 2).join(", "));

    return {
      link,
      node,
      svg
    };
  };

  // Update element positions on tick
  const updatePositions = (elements: any, nodes: NarrativeNode[], links: any[]) => {
    const { link, node, svg } = elements;
    
    // Update link paths using curved lines
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });

    // Update particle positions
    svg.selectAll(".flow-particle").each(function(d, i) {
      const linkIndex = i % links.length;
      const link = links[linkIndex];
      
      // Calculate position along the path
      const t = (Date.now() / 4000 + i * 0.2) % 1;
      
      // Linear interpolation for position
      const sourceX = link.source.x;
      const sourceY = link.source.y;
      const targetX = link.target.x;
      const targetY = link.target.y;
      
      // Add curve to match the path
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      
      // Simple curved path approximation
      const curveX = sourceX + dx * t;
      const curveY = sourceY + dy * t - Math.sin(t * Math.PI) * 20;
      
      d3.select(this)
        .attr("cx", curveX)
        .attr("cy", curveY);
    });

    // Update node positions
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  };

  return {
    drawVisualization,
    updatePositions
  };
};
