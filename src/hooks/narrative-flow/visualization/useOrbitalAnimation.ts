
import { NarrativeNode } from '@/types/narratives';
import { VisualizationElements } from './types';

export const useOrbitalAnimation = () => {
  // Setup and manage animations without d3
  const setupOrbitalAnimation = (
    elements: VisualizationElements,
    nodes: NarrativeNode[]
  ): number | null => {
    // Return null if no separate animation loop is needed
    return null; 
  };

  // Create starfield background effect using native DOM methods
  const createStarfield = (
    svg: any,
    width: number,
    height: number
  ) => {
    const starGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    starGroup.setAttribute("class", "starfield");
    svg.appendChild(starGroup);
    
    const numStars = 150;
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.1;
      const opacity = Math.random() * 0.5 + 0.1;
      
      const colorRand = Math.random();
      let color = "white";
      if (colorRand > 0.95) {
        const colors = ["#f0f8ff", "#fffaf0", "#f5f5dc", "#e6e6fa"];
        color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      star.setAttribute("cx", x.toString());
      star.setAttribute("cy", y.toString());
      star.setAttribute("r", size.toString());
      star.setAttribute("fill", color);
      star.setAttribute("opacity", opacity.toString());
      
      starGroup.appendChild(star);
      
      // Twinkling effect
      if (Math.random() > 0.8) {
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "opacity");
        animate.setAttribute("values", `${opacity};${opacity * 0.3};${opacity}`);
        animate.setAttribute("dur", `${3 + Math.random() * 6}s`);
        animate.setAttribute("repeatCount", "indefinite");
        star.appendChild(animate);
      }
    }
    
    // Add galaxies
    for (let i = 0; i < 2; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const galaxySize = 20 + Math.random() * 30;
      
      const galaxy = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      galaxy.setAttribute("cx", x.toString());
      galaxy.setAttribute("cy", y.toString());
      galaxy.setAttribute("r", galaxySize.toString());
      galaxy.setAttribute("fill", "rgba(120, 120, 180, 0.02)");
      galaxy.setAttribute("filter", "blur(8px)");
      
      starGroup.appendChild(galaxy);
    }
    
    return starGroup;
  };

  return {
    setupOrbitalAnimation,
    createStarfield
  };
};
