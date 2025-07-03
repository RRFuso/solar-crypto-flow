
import * as d3 from 'd3';
import { NarrativeLink } from './types';

export const useLinks = () => {
  // Create links between nodes
  const createLinks = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    links: NarrativeLink[],
    isPredicted: boolean = false
  ) => {
    // Create link group
    const linkGroup = svg.append("g").attr("class", "links");
    
    // Create gradient definitions for each link
    svg.append("defs").selectAll("linearGradient")
      .data(links)
      .enter()
      .append("linearGradient")
      .attr("id", (d, i) => `flow-gradient-${i}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .each(function(d, i) {
        // Determine colors based on prediction or flow direction
        const startColor = isPredicted ? "#00ffaa" : "#ff3366"; // Green for predictions, Red for historical
        const endColor = isPredicted ? "#4ade80" : "#00aaff"; // End with blue for historical
        
        // Add gradient stops
        d3.select(this).selectAll("stop")
          .data([
            { offset: "0%", color: startColor },
            { offset: "100%", color: endColor }
          ])
          .enter()
          .append("stop")
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color);
      });
    
    // Create curved link paths with gradients and dashed animation
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link-path")
      .attr("fill", "none")
      .attr("stroke", (d, i) => `url(#flow-gradient-${i})`)
      .attr("stroke-width", d => 2 + Math.min(8, (d.value / 1000000000) * 5))
      .attr("stroke-dasharray", "5,5") // Dashed line
      .attr("opacity", 0.7)
      .attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      })
      .style("animation", "flowDash 20s linear infinite"); // Add flow animation
    
    // Create arrowheads for directional flow
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter()
      .append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => isPredicted ? "#00ffaa" : "#4ade80")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    return { link, linkGroup };
  };

  // Update link paths when nodes move
  const updateLinkPaths = (
    link: d3.Selection<SVGPathElement, NarrativeLink, SVGGElement, unknown>
  ) => {
    if (!link) return;
    
    link.attr("d", d => {
      if (!d || !d.source || !d.target) return "";
      
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });
    
    // Update gradient positions
    link.each(function(d, i) {
      if (!d || !d.source || !d.target) return;
      
      const gradient = d3.select(`#flow-gradient-${i}`);
      if (!gradient.empty()) {
        gradient
          .attr("x1", d.source.x)
          .attr("y1", d.source.y)
          .attr("x2", d.target.x)
          .attr("y2", d.target.y);
      }
    });
  };

  // Flow particles have been removed as requested by the user
  // Instead, we're using animated dash pattern
  const updateFlowParticles = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    links: NarrativeLink[]
  ) => {
    // Intentionally left empty as per requirement to remove flow particles
    // We're just keeping the function for API compatibility
  };

  return {
    createLinks,
    updateLinkPaths,
    updateFlowParticles
  };
};
