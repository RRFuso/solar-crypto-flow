
import * as d3 from 'd3';

/**
 * Adds animated particles flowing along the links to represent capital movement
 */
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: LinkData[],
  selectedNodeId?: string | null
) => {
  // Remove any existing particles first
  svg.selectAll(".particles-group").remove();
  
  // Create particle group
  const particleGroup = linkGroup.append("g")
    .attr("class", "particles-group");
  
  // Process each link for particle animation
  links.forEach((link: LinkData, linkIndex) => {
    // Skip particle animation for unselected links when a node is selected
    if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
      return;
    }
    
    // Get the path element for this link
    const path = svg.select(`#link-${linkIndex}`).node() as SVGPathElement;
    if (!path) return;
    
    // Calculate number of particles based on value
    let particleCount = 1 + Math.floor(Math.min(5, Math.abs(link.value) / 10000000));
    
    // Increase particles for selected links
    if (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) {
      particleCount += 2; // Add more particles to selected links
    }
    
    // Create particles for this link
    for (let i = 0; i < particleCount; i++) {
      // Determine color based on predictions and flow direction
      let particleColor: string;
      
      if (link.predictionColor) {
        particleColor = link.predictionColor;
      } else {
        particleColor = link.percentage > 0 ? "#4ade80" : "#f43f5e";
      }
      
      // Initial position along the path
      const initialPosition = i / particleCount;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(initialPosition * pathLength);
      
      // Create particle with data
      particleGroup.append("circle")
        .datum({
          linkIndex,
          path: path,
          progress: initialPosition,
          speed: 0.003 + Math.random() * 0.003, // Randomize speed slightly
          direction: link.percentage > 0 ? 1 : -1, // Direction based on flow
          color: particleColor,
          pathLength: pathLength
        })
        .attr("class", "particle")
        .attr("r", 2 + Math.random() * 2) // Size between 2-4px
        .attr("fill", (d: { color: string }) => d.color)
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("opacity", 0.7)
        .attr("filter", "blur(1px)");
    }
  });
  
  // Setup animation loop for particles
  function animateParticles() {
    svg.selectAll(".particle").each(function(d: { linkIndex: number; path: SVGPathElement; progress: number; speed: number; direction: number; color: string; pathLength: number }) {
      // Update progress along path
      d.progress += d.speed * d.direction;
      
      // Reset when reaching end
      if (d.progress > 1) d.progress = 0;
      if (d.progress < 0) d.progress = 1;
      
      // Calculate position along path
      if (d.path && d.pathLength) {
        const point = d.path.getPointAtLength(d.progress * d.pathLength);
        
        // Update particle position
        d3.select(this)
          .attr("cx", point.x)
          .attr("cy", point.y);
      }
    });
    
    // Continue animation
    requestAnimationFrame(animateParticles);
  }
  
  // Start animation
  requestAnimationFrame(animateParticles);
};
