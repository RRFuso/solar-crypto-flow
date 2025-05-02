
import * as d3 from 'd3';

/**
 * Adds animated particles along link paths to visualize flow direction and intensity
 */
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId?: string | null
) => {
  // Add animated particles along the links for flow visualization
  links.forEach((link, i) => {
    // Skip animation for faded links if a node is selected
    if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
      return;
    }
    
    // Number of particles based on flow value - more particles for larger flows
    const numParticles = Math.min(6, Math.max(2, Math.floor(Math.abs(link.value))));
    const particleGroup = linkGroup.append("g").attr("class", "particles");
    
    // Determine particle color based on prediction or flow direction
    const particleColor = link.predictionColor || (link.percentage > 0 ? "#4ade80" : "#f43f5e");
    
    // Create particles
    for (let j = 0; j < numParticles; j++) {
      particleGroup.append("circle")
        .attr("class", "particle")
        .attr("r", link.predictionColor ? 2.5 : 2) // Slightly larger for prediction links
        .attr("fill", particleColor)
        .attr("opacity", link.predictionColor ? 0.9 : 0.8);
      
      // Add glow effect for prediction particles
      if (link.predictionColor) {
        particleGroup.append("circle")
          .attr("class", "particle-glow")
          .attr("r", 4)
          .attr("fill", "none")
          .attr("stroke", particleColor)
          .attr("stroke-width", 1)
          .attr("opacity", 0.5)
          .attr("filter", "url(#glow)");
      }
    }
    
    // Animate particles along path
    const linkNode = link;
    const particleNodes = particleGroup.selectAll(".particle, .particle-glow");
    const pathElement = svg.select(`#link-${i}`).node();
    
    if (pathElement) {
      const pathLength = (pathElement as SVGPathElement).getTotalLength();
      
      function animateParticles() {
        particleNodes.each(function(d, j) {
          // Calculate position along path based on time
          // Use different speeds based on if it's a prediction or not
          const speed = link.predictionColor ? 3000 : 2000; // Faster for prediction links
          const offset = ((Date.now() / speed) + (j / numParticles)) % 1;
          // Get the point at specified position along the path
          const point = (pathElement as SVGPathElement).getPointAtLength(offset * pathLength);
          
          // Update particle position
          d3.select(this)
            .attr("cx", point.x)
            .attr("cy", point.y);
        });
        
        requestAnimationFrame(animateParticles);
      }
      
      animateParticles();
    }
  });
};
