
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

export const useAnimationUpdates = () => {
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

    // Update node positions
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  };

  return {
    updatePositions
  };
};
