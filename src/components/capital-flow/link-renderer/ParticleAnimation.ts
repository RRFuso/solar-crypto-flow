
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
  // Remove any existing particles first
  svg.selectAll(".particles-group").remove();
  
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
    const path = svg.select(`#link-${linkIndex}`);
    const pathElement = path.node() as SVGPathElement;
    if (!pathElement) return;
    
    // Calculate number of particles based on value
    let particleCount = Math.max(2, Math.min(5, Math.floor(Math.abs(link.value) / 10000000)));
    
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
      
      // Calculate path length once
      const pathLength = pathElement.getTotalLength();
      
      // Initial position along the path
      const initialPosition = i / particleCount;      
      const point = pathElement.getPointAtLength(initialPosition * pathLength);
      
      // Create particle with data
      particleGroup.append("circle")
        .datum({
          linkIndex,
          pathElement: pathElement,
          progress: initialPosition,
          speed: 0.004, // Standardized speed for consistent animation
          direction: link.percentage > 0 ? 1 : -1, // Direction based on flow
          color: particleColor,
          pathLength: pathLength,
          completionTime: 6000 // 6 seconds to complete the path
        })
        .attr("class", "particle")
        .attr("r", 2.5) // Fixed size for consistency
        .attr("fill", d => d.color)
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("opacity", 0.8)
        .attr("filter", "blur(1px)");
    }
  });
  
  // Setup animation loop for particles with timestamp for smoother animation
  let lastTimestamp = 0;
  
  function animateParticles(timestamp: number) {
    // Calculate delta time for smooth animation regardless of frame rate
    const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016;
    lastTimestamp = timestamp;
    
    svg.selectAll(".particle").each(function(d: any) {
      if (!d.pathElement) return;
      
      // Update progress along path - use fixed step for consistent speed
      const step = (deltaTime / d.completionTime) * 6; // 6 seconds to complete the path
      d.progress += step * d.direction;
      
      // Reset when reaching end
      if (d.progress > 1) d.progress = 0;
      if (d.progress < 0) d.progress = 1;
      
      // Calculate position along path
      if (d.pathElement && d.pathLength) {
        const point = d.pathElement.getPointAtLength(d.progress * d.pathLength);
        
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
