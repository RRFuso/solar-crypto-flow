
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { VisualizationElements } from './types';

export const useOrbitalAnimation = () => {
  // Setup and manage orbital animations
  const setupOrbitalAnimation = (
    elements: VisualizationElements,
    nodes: NarrativeNode[]
  ): number => {
    const { link, node, svg } = elements;
    
    // Find the central node (Bitcoin or largest)
    const centralNode = nodes.find(n => n.name.toLowerCase().includes("bitcoin")) || 
                     nodes.reduce((max, n) => n.value > max.value ? n : max, nodes[0]);
    
    let lastTimestamp = Date.now();
    
    const orbitAnimationFrame = () => {
      const now = Date.now();
      const elapsed = now - lastTimestamp;
      lastTimestamp = now;
      
      // Skip if no time has passed (prevents jumps on first frame)
      if (elapsed === 0) {
        return requestAnimationFrame(orbitAnimationFrame);
      }
      
      // Apply subtle rotation to all non-central nodes
      if (centralNode) {
        const rotationSpeed = 0.00005; // Very slow rotation
        
        nodes.forEach(node => {
          if (node === centralNode) return;
          
          // Calculate current angle from center
          const dx = node.x - centralNode.x;
          const dy = node.y - centralNode.y;
          const angle = Math.atan2(dy, dx) + rotationSpeed * elapsed;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Update position with rotation
          node.x = centralNode.x + Math.cos(angle) * distance;
          node.y = centralNode.y + Math.sin(angle) * distance;
        });
        
        // Update node positions
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        
        // Update link paths using curved lines
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
      }
      
      return requestAnimationFrame(orbitAnimationFrame);
    };
    
    // Start orbital animation
    return requestAnimationFrame(orbitAnimationFrame);
  };
  
  // Create starfield background effect
  const createStarfield = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
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
    
    return starGroup;
  };

  return {
    setupOrbitalAnimation,
    createStarfield
  };
};
