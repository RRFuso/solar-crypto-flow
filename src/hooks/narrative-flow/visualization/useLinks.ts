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
    
    // Determine link color based on whether it's a predicted flow
    const getColor = (d: NarrativeLink) => {
      if (isPredicted) {
        return "#00ffaa"; // Green for predictions
      } else {
        return "#ff00aa"; // Pink for historical
      }
    };
    
    // Create curved link paths
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", d => getColor(d))
      .attr("stroke-width", d => 2 + Math.min(8, (d.value / 1000000000) * 5))
      .attr("stroke-dasharray", "10,10")
      .attr("opacity", 0.7)
      .attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
    
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
      .attr("fill", d => getColor(d))
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    return { link, linkGroup };
  };

  // Update link paths when nodes move
  const updateLinkPaths = (
    link: d3.Selection<SVGPathElement, NarrativeLink, SVGGElement, unknown>
  ) => {
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });
  };

  // Flow particles have been removed as requested by the user
  // Instead, just update link paths
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
