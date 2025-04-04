
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

export const useLinks = () => {
  // Create and style link elements for the visualization
  const createLinks = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    links: any[],
    isPredicted: boolean
  ) => {
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
        svg.append("circle")
          .attr("r", 3)
          .attr("fill", isPredicted ? "#00ffaa" : "#ff00aa")
          .attr("class", "flow-particle")
          .attr("opacity", 0.8)
          .attr("data-link-index", i)
          .attr("data-particle-index", j);
      }
    });
    
    return { link, linkGroup };
  };

  // Update path of links with curved style
  const updateLinkPaths = (
    link: d3.Selection<SVGPathElement, any, SVGGElement, unknown>
  ) => {
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });
  };

  // Update flow particles along the links
  const updateFlowParticles = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    links: any[]
  ) => {
    svg.selectAll(".flow-particle").each(function() {
      const particle = d3.select(this);
      const linkIndex = parseInt(particle.attr("data-link-index"));
      const particleIndex = parseInt(particle.attr("data-particle-index"));
      
      if (Number.isNaN(linkIndex) || linkIndex >= links.length) return;
      
      const link = links[linkIndex];
      
      try {
        // Get current position along the path
        const t = ((Date.now() / 3000) + (particleIndex * 0.3)) % 1;
        
        // Get the path element for this link
        const pathElements = svg.selectAll(".link").nodes();
        if (linkIndex >= pathElements.length) return;
        
        const pathElement = pathElements[linkIndex];
        const pathLength = pathElement.getTotalLength();
        const point = pathElement.getPointAtLength(pathLength * t);
        
        // Set the particle position
        particle
          .attr("cx", point.x)
          .attr("cy", point.y);
      } catch (e) {
        console.error(e);
      }
    });
  };

  return {
    createLinks,
    updateLinkPaths,
    updateFlowParticles
  };
};
