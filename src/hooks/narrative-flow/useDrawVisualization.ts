
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { useCryptoLogos } from '@/contexts/CryptoLogosContext';

interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: any[];
  isPredicted: boolean;
  dragHandlers: any;
}

export const useDrawVisualization = () => {
  const { getLogo } = useCryptoLogos();
  
  // Create visual elements for the flow visualization
  const drawVisualization = (options: DrawOptions) => {
    const { svg, nodes, links, isPredicted, dragHandlers } = options;
    
    // Create defs for glows and clip paths
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
          .attr("opacity", 0.8)
          .attr("data-link-index", i)
          .attr("data-particle-index", j);
      }
    });

    // Add nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", d => d.id)
      .call(d3.drag()
        .on("start", dragHandlers.dragstarted)
        .on("drag", dragHandlers.dragged)
        .on("end", dragHandlers.dragended));

    // Add node circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", d => d.attentionScore && d.attentionScore > 50 ? "#ffffff" : "rgba(255,255,255,0.5)")
      .attr("stroke-width", d => d.attentionScore && d.attentionScore > 50 ? 3 : 2)
      .attr("opacity", 0.7)
      .attr("filter", "url(#glow)");
      
    // Add attention indicator pulse for high attention narratives
    node.filter(d => d.attentionScore && d.attentionScore > 70)
      .append("circle")
      .attr("r", d => d.radius + 5)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.5)
      .attr("class", "attention-pulse");
      
    // Add animation to attention pulse
    node.selectAll(".attention-pulse")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius + 5};${d.radius + 15};${d.radius + 5}`)
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");

    return {
      link,
      node,
      svg
    };
  };

  return {
    drawVisualization
  };
};
