import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { VisualizationElements } from './types';

export const useOrbitalAnimation = () => {
  // Setup and manage animations (if any beyond D3 simulation)
  const setupOrbitalAnimation = (
    elements: VisualizationElements,
    nodes: NarrativeNode[]
  ): number | null => {
    // const { link, node, svg } = elements;

    // NOTE: The D3 simulation itself handles the positioning and movement
    // of nodes based on forces (including the radial/orbital force).
    // Applying an additional manual rotation here can conflict with the simulation
    // and might be the source of the desynchronization if not applied correctly
    // to the entire node group <g>.

    // If a continuous, slow orbital rotation *independent* of the simulation's
    // physics is desired, it needs careful implementation. However, for now,
    // let's rely solely on the D3 simulation tick to update positions via
    // the updatePositions -> updateNodePositions chain, which applies the
    // transform to the entire node group <g>.

    // If other non-D3 animations are needed (e.g., particle flow), 
    // the requestAnimationFrame loop could be used for those.
    
    // Example: If particle animation was needed
    /*
    let lastTimestamp = Date.now();
    const animationFrame = () => {
      const now = Date.now();
      const elapsed = now - lastTimestamp;
      lastTimestamp = now;

      if (elapsed > 0) {
        // Update particle positions here, for example
        // updateFlowParticles(svg, links, elapsed); 
      }

      return requestAnimationFrame(animationFrame);
    };
    return requestAnimationFrame(animationFrame);
    */

    // Return null if no separate animation loop is needed
    return null; 
  };

  // Create starfield background effect - enhanced with more stars and variety
  const createStarfield = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number
  ) => {
    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 150; // Adjusted star count for potentially smaller view
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.1; // Smaller max size
      const opacity = Math.random() * 0.5 + 0.1; // Dimmer max opacity
      
      const colorRand = Math.random();
      let color = "white";
      if (colorRand > 0.95) { // Fewer colored stars
        const colors = ["#f0f8ff", "#fffaf0", "#f5f5dc", "#e6e6fa"];
        color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", color)
        .attr("opacity", opacity);
        
      // Twinkling effect
      if (Math.random() > 0.8) { // Fewer twinkling stars
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.3};${opacity}`)
          .attr("dur", `${3 + Math.random() * 6}s`)
          .attr("repeatCount", "indefinite");
      }
    }
    
    // Fewer, smaller galaxies
    for (let i = 0; i < 2; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const galaxySize = 20 + Math.random() * 30;
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", galaxySize)
        .attr("fill", "rgba(120, 120, 180, 0.02)") // More subtle fill
        .attr("filter", "blur(8px)"); // Less blur
    }
    
    return starGroup;
  };

  return {
    setupOrbitalAnimation,
    createStarfield
  };
};

