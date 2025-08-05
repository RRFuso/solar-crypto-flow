
import * as d3 from 'd3';
import { LinkData } from '@/types/capitalFlow';
import { globalAnimator, SmoothInterpolator, domBatcher } from '@/utils/animationOptimizer';

interface ParticleData {
  linkIndex: number;
  path: SVGPathElement;
  progress: SmoothInterpolator;
  speed: number;
  direction: number;
  color: string;
  pathLength: number;
  element: d3.Selection<SVGCircleElement, unknown, null, undefined>;
}

/**
 * Sistema otimizado de partículas com animação fluida
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
  
  const particles: ParticleData[] = [];
  
  // Process each link for particle animation
  links.forEach((link: LinkData, linkIndex) => {
    // Skip particle animation for unselected links when a node is selected
    if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
      return;
    }
    
    // Get the path element for this link
    const path = svg.select(`#link-${linkIndex}`).node() as SVGPathElement;
    if (!path) return;
    
    // Calculate number of particles based on value (reduced for better performance)
    let particleCount = Math.min(3, 1 + Math.floor(Math.abs(link.value) / 20000000));
    
    // Increase particles for selected links
    if (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) {
      particleCount = Math.min(5, particleCount + 1); // Moderately increase particles
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
      
      // Initial position along the path with better distribution
      const initialPosition = (i + Math.random() * 0.3) / particleCount;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(initialPosition * pathLength);
      
      // Create smooth interpolator for position
      const progressInterpolator = new SmoothInterpolator(initialPosition, 0.08);
      
      // Create particle element
      const element = particleGroup.append("circle")
        .attr("class", "particle")
        .attr("r", 2.5) // Fixed size for better performance
        .attr("fill", particleColor)
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("opacity", 0.8)
        .style("filter", "drop-shadow(0 0 3px currentColor)");
      
      // Store particle data
      particles.push({
        linkIndex,
        path: path,
        progress: progressInterpolator,
        speed: 0.002 + Math.random() * 0.002, // Slightly slower for smoother motion
        direction: link.percentage > 0 ? 1 : -1,
        color: particleColor,
        pathLength: pathLength,
        element: element
      });
    }
  });
  
  // Optimized animation loop using global animator
  const animateParticles = (deltaTime: number) => {
    // Batch DOM operations for better performance
    const updates: (() => void)[] = [];
    
    particles.forEach(particle => {
      // Update progress with smooth interpolation
      const currentProgress = particle.progress.getCurrentValue();
      let newProgress = currentProgress + (particle.speed * particle.direction * deltaTime / 16.67);
      
      // Handle wrapping with smooth transition
      if (newProgress > 1) {
        newProgress = 0;
        particle.progress.setTarget(0);
      } else if (newProgress < 0) {
        newProgress = 1;
        particle.progress.setTarget(1);
      } else {
        particle.progress.setTarget(newProgress);
      }
      
      // Update interpolator
      const smoothProgress = particle.progress.update(deltaTime);
      
      // Calculate position along path
      if (particle.path && particle.pathLength > 0) {
        const point = particle.path.getPointAtLength(smoothProgress * particle.pathLength);
        
        // Batch the DOM update
        updates.push(() => {
          particle.element
            .attr("cx", point.x)
            .attr("cy", point.y);
        });
      }
    });
    
    // Execute all DOM updates at once
    if (updates.length > 0) {
      domBatcher.add(() => updates.forEach(update => update()));
    }
  };
  
  // Register with global animator
  globalAnimator.addCallback(animateParticles);
  globalAnimator.start();
  
  // Return cleanup function
  return () => {
    globalAnimator.removeCallback(animateParticles);
    particles.length = 0;
  };
};
