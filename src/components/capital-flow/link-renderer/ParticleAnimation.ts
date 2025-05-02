
import * as d3 from 'd3';

/**
 * Adds animated particles flowing along the links to represent capital movement
 */
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId?: string | null
) => {
  // Create particle group
  const particleGroup = linkGroup.append("g")
    .attr("class", "particles-group");
  
  // Process each link for particle animation
  links.forEach((link, linkIndex) => {
    // Skip particle animation for unselected links when a node is selected
    if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
      return;
    }
    
    // Get the path element for this link
    const path = svg.select(`#link-${linkIndex}`).node();
    if (!path) return;
    
    // Calculate number of particles based on value
    let particleCount = 1 + Math.floor(Math.min(5, Math.abs(link.value) / 10000000));
    
    // Increase particles for selected links
    if (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) {
      particleCount += 2; // Add more particles to selected links
    }
    
    // Create particles for this link
    const particles: d3.Selection<SVGCircleElement, any, null, undefined>[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Determine color based on predictions and flow direction
      let particleColor: string;
      
      if (link.predictionColor) {
        particleColor = link.predictionColor;
      } else {
        particleColor = link.percentage > 0 ? "#4ade80" : "#f43f5e";
      }
      
      // Create particle with data
      const particle = particleGroup.append("circle")
        .datum({
          linkIndex,
          pathElement: path,
          progress: i / particleCount, // Starting position along the path
          speed: 0.003 + Math.random() * 0.003, // Randomize speed slightly
          direction: link.percentage > 0 ? 1 : -1, // Direction based on flow
          color: particleColor
        })
        .attr("class", "particle")
        .attr("r", 2 + Math.random() * 2) // Size between 2-4px
        .attr("fill", d => d.color)
        .attr("opacity", 0.7)
        .attr("filter", "blur(1px)");
      
      particles.push(particle);
    }
    
    // Animate particles
    animateParticles(particles, path, link);
  });
};

/**
 * Set up animation for particles along paths
 */
const animateParticles = (
  particles: d3.Selection<SVGCircleElement, any, null, undefined>[],
  path: any,
  link: any
) => {
  const pathLength = path.getTotalLength();
  
  // Animation function
  const animateParticle = () => {
    particles.forEach(particle => {
      particle.each(function(d) {
        // Update progress
        d.progress += d.speed * d.direction;
        
        // Reset when reaching end
        if (d.progress > 1) d.progress = 0;
        if (d.progress < 0) d.progress = 1;
        
        // Calculate position along path
        try {
          if (path) {
            const point = path.getPointAtLength(d.progress * pathLength);
            // Update particle position
            d3.select(this)
              .attr("cx", point.x)
              .attr("cy", point.y);
          }
        } catch (e) {
          console.error("Error animating particle:", e);
        }
      });
    });
    
    // Request next frame
    requestAnimationFrame(animateParticle);
  };
  
  // Start animation
  requestAnimationFrame(animateParticle);
};
