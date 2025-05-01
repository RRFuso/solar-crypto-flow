
import * as d3 from 'd3';

/**
 * Adds animated flow particles along the links
 */
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: any[],
  selectedNodeId?: string | null
) => {
  // Create filter for glowing particles
  const defs = svg.select("defs") || svg.append("defs");
  
  if (!defs.select("#particle-glow").node()) {
    const filter = defs.append("filter")
      .attr("id", "particle-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "1.5")
      .attr("result", "blur");
    
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");
  }
  
  // Create a particle group for each link
  links.forEach((link, i) => {
    // Skip particles for links with very low value to improve performance
    if (Math.abs(link.value) < 0.1) return;
    
    // Determine if this link should be highlighted based on selected node
    const isHighlighted = selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId);
    
    // Determine number of particles based on value and if highlighted
    const particleCount = Math.min(20, Math.max(3, Math.floor(Math.abs(link.value) * 2))) + (isHighlighted ? 5 : 0);
    
    // Create particle group
    const particleGroup = linkGroup.append("g")
      .attr("class", "particles")
      .attr("data-source", link.source.id)
      .attr("data-target", link.target.id);
    
    // Get the path element for this link
    // We'll draw along it
    const path = svg.selectAll("path.link").filter((d: any, j: number) => {
      return j === i;
    }).node() as SVGPathElement;
    
    if (!path) return;
    
    // Create particles
    for (let j = 0; j < particleCount; j++) {
      const particle = particleGroup.append("circle")
        .attr("r", isHighlighted ? 2.5 : 1.8)
        .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
        .attr("opacity", isHighlighted ? 0.85 : 0.7)
        .attr("filter", "url(#particle-glow)");
      
      // Animate the particle along the path
      animateParticle(particle, path, link.percentage < 0);
    }
  });
};

/**
 * Animates a single particle along a path
 */
const animateParticle = (
  particle: d3.Selection<SVGCircleElement, unknown, null, undefined>,
  path: SVGPathElement,
  isReverseFlow: boolean
) => {
  // Get the total length of the path
  const pathLength = path.getTotalLength();
  
  // Set initial position
  const startPoint = isReverseFlow ? 
    path.getPointAtLength(pathLength) : 
    path.getPointAtLength(0);
  
  particle
    .attr("cx", startPoint.x)
    .attr("cy", startPoint.y);
  
  // Recursive animation function
  function animate() {
    // Current position (0 to 1)
    let position = parseFloat(particle.attr("position") || "0");
    
    // Apply a small random offset for more natural flow
    const speed = 0.005 + Math.random() * 0.003;
    position = isReverseFlow ? position - speed : position + speed;
    
    // Reset position when reaching the end/start
    if (position > 1) position = 0;
    if (position < 0) position = 1;
    
    // Store current position
    particle.attr("position", position);
    
    // Get the point at current position
    const point = path.getPointAtLength(position * pathLength);
    
    // Update particle position
    particle
      .attr("cx", point.x)
      .attr("cy", point.y);
    
    // Continue animation
    requestAnimationFrame(animate);
  }
  
  // Start with a random position along the path for more natural distribution
  particle.attr("position", Math.random().toString());
  
  // Start animation
  animate();
};
