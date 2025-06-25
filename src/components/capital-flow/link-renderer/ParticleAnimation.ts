
/**
 * Simple particle animation system without d3 dependency
 */

interface ParticleData {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

export const addFlowParticles = (
  svg: Element,
  linkGroup: Element,
  links: any[],
  selectedNodeId?: string | null
) => {
  // Remove any existing particles first
  const existingParticles = svg.querySelectorAll(".particles-group");
  existingParticles.forEach(el => el.remove());
  
  // Create particle group
  const particleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  particleGroup.setAttribute("class", "particles-group");
  linkGroup.appendChild(particleGroup);
  
  const particles: ParticleData[] = [];
  
  // Process each link for particle animation
  links.forEach((link, linkIndex) => {
    // Skip particle animation for unselected links when a node is selected
    if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
      return;
    }
    
    // Calculate number of particles based on value
    let particleCount = 1 + Math.floor(Math.min(5, Math.abs(link.value) / 10000000));
    
    // Increase particles for selected links
    if (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) {
      particleCount += 2;
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
      
      // Create particle data
      const particle: ParticleData = {
        x: link.source.x || 0,
        y: link.source.y || 0,
        targetX: link.target.x || 0,
        targetY: link.target.y || 0,
        progress: i / particleCount,
        speed: 0.003 + Math.random() * 0.003,
        color: particleColor,
        size: 2 + Math.random() * 2
      };
      
      particles.push(particle);
      
      // Create SVG circle for particle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "particle");
      circle.setAttribute("r", particle.size.toString());
      circle.setAttribute("fill", particle.color);
      circle.setAttribute("opacity", "0.7");
      circle.setAttribute("filter", "blur(1px)");
      
      particleGroup.appendChild(circle);
    }
  });
  
  // Setup animation loop for particles
  function animateParticles() {
    const particleElements = particleGroup.querySelectorAll(".particle");
    
    particles.forEach((particle, index) => {
      // Update progress along path
      particle.progress += particle.speed;
      
      // Reset when reaching end
      if (particle.progress > 1) particle.progress = 0;
      
      // Calculate position along line
      const x = particle.x + (particle.targetX - particle.x) * particle.progress;
      const y = particle.y + (particle.targetY - particle.y) * particle.progress;
      
      // Update particle position
      const element = particleElements[index] as SVGCircleElement;
      if (element) {
        element.setAttribute("cx", x.toString());
        element.setAttribute("cy", y.toString());
      }
    });
    
    // Continue animation
    requestAnimationFrame(animateParticles);
  }
  
  // Start animation
  requestAnimationFrame(animateParticles);
};
