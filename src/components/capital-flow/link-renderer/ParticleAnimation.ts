
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
    
    for (let j = 0; j < numParticles; j++) {
      particleGroup.append("circle")
        .attr("class", "particle")
        .attr("r", 2)
        .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
        .attr("opacity", 0.8);
    }
    
    // Animate particles along path
    const linkNode = link;
    const particleNodes = particleGroup.selectAll(".particle");
    const pathElement = linkGroup.select(`.link:nth-child(${i + 1})`).node();
    
    if (pathElement) {
      const pathLength = (pathElement as SVGPathElement).getTotalLength();
      
      function animateParticles() {
        particleNodes.each(function(d, j) {
          // Calculate position along path based on time
          const offset = ((Date.now() / 2000) + (j / numParticles)) % 1;
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
