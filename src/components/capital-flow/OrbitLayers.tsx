
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface OrbitLayersProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
  extendFullScreen?: boolean;
}

export class OrbitLayers {
  constructor(props: OrbitLayersProps) {
    this.renderOrbits(props);
  }
  
  private renderOrbits({ svg, width, height, orbitLayers, baseRadius, extendFullScreen = false }: OrbitLayersProps) {
    // Clear any existing orbit circles first
    svg.selectAll(".orbit-circle").remove();
    
    // Calculate the maximum radius that covers the entire screen
    const maxScreenRadius = Math.max(
      Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2)) * 1.2, // Diagonal distance * 1.2 for full coverage
      Math.max(width, height)
    );
    
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      const orbitRadius = extendFullScreen && i === orbitLayers 
        ? maxScreenRadius // Last orbit extends to screen edge
        : i * baseRadius * 2; // Normal orbit spacing

      svg.append("circle")
        .attr("class", "orbit-circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.15)")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,5");
    }
    
    // If extending to full screen, add additional orbits to fill the space
    if (extendFullScreen) {
      const baseLayers = orbitLayers;
      const additionalLayers = 3; // Add more orbits for better spacing
      
      for (let i = 1; i <= additionalLayers; i++) {
        // Create additional orbits between the last regular orbit and the extended one
        const progress = i / (additionalLayers + 1);
        const lastRegularOrbit = baseLayers * baseRadius * 2;
        const orbitRadius = lastRegularOrbit + progress * (maxScreenRadius - lastRegularOrbit);
        
        svg.append("circle")
          .attr("class", "orbit-circle")
          .attr("cx", width / 2)
          .attr("cy", height / 2)
          .attr("r", orbitRadius)
          .attr("fill", "none")
          .attr("stroke", "rgba(255, 255, 255, 0.1)") // Slightly more transparent
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,7"); // More sparse dashes for distant orbits
      }
    }
  }
}

// Fix component export for Fast Refresh compatibility
export const OrbitLayersComponent = React.memo((props: OrbitLayersProps) => {
  useEffect(() => {
    new OrbitLayers(props);
    
    // Cleanup
    return () => {
      props.svg.selectAll(".orbit-circle").remove();
    };
  }, [props]);
  
  return null;
});
