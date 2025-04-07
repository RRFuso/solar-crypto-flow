
import React from 'react';
import * as d3 from 'd3';

interface OrbitalPathsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  width: number;
  height: number;
  orbitRadii: number[];
}

export const createOrbitalPaths = (props: OrbitalPathsProps) => {
  const { svg, nodes, width, height, orbitRadii } = props;

  // Draw orbit paths with larger distances
  nodes.forEach((node, i) => {
    if (!node.isCentral) {
      const orbitPath = svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadii[i])
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    }
  });
};

// Create enhanced starfield background
export const createStarfield = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  numStars: number = 200 // Increased number of stars
) => {
  const starGroup = svg.append("g").attr("class", "starfield");
  
  // Add distant nebula effects for more depth
  const numNebulas = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numNebulas; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 250 + 150;
    
    // Generate colors for nebulas
    const nebulaColors = [
      'rgba(41, 121, 255, 0.04)',
      'rgba(147, 51, 234, 0.03)',
      'rgba(236, 72, 153, 0.04)',
      'rgba(59, 130, 246, 0.03)',
      'rgba(16, 185, 129, 0.03)'
    ];
    
    const nebula = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", nebulaColors[Math.floor(Math.random() * nebulaColors.length)])
      .attr("filter", "blur(30px)");
  }
  
  // Add stars with varied sizes and brightness
  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.2; // Larger stars
    const opacity = Math.random() * 0.7 + 0.2; // More visible stars
    
    const star = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", "white")
      .attr("opacity", opacity);
      
    // Add twinkling to more stars
    if (Math.random() > 0.5) { // More twinkling stars
      star.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", `${opacity};${opacity * 0.3};${opacity}`)
        .attr("dur", `${2 + Math.random() * 5}s`)
        .attr("repeatCount", "indefinite");
    }
  }
  
  // Add a few brighter stars with subtle glow
  for (let i = 0; i < numStars / 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 1;
    
    // Create glow effect
    const starGlow = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size * 3)
      .attr("fill", "rgba(255, 255, 255, 0.1)")
      .attr("filter", "blur(2px)");
      
    // Actual star
    const brightStar = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", "white")
      .attr("opacity", 0.9);
      
    // Add subtle pulsing effect
    if (Math.random() > 0.5) {
      brightStar.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.9;0.7;0.9")
        .attr("dur", `${3 + Math.random() * 4}s`)
        .attr("repeatCount", "indefinite");
        
      starGlow.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", "0.1;0.05;0.1")
        .attr("dur", `${3 + Math.random() * 4}s`)
        .attr("repeatCount", "indefinite");
    }
  }
  
  return starGroup;
};
