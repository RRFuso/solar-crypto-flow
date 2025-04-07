
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
  numStars: number = 150 // Increased number of stars
) => {
  const starGroup = svg.append("g").attr("class", "starfield");
  
  // Add distant nebula effects
  const numNebulas = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numNebulas; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 200 + 100;
    
    // Generate colors for nebulas
    const nebulaColors = [
      'rgba(41, 121, 255, 0.05)',
      'rgba(147, 51, 234, 0.04)',
      'rgba(236, 72, 153, 0.05)',
      'rgba(59, 130, 246, 0.04)',
      'rgba(16, 185, 129, 0.03)'
    ];
    
    const nebula = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", nebulaColors[Math.floor(Math.random() * nebulaColors.length)])
      .attr("filter", "blur(20px)");
  }
  
  // Add stars
  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 0.2; // Slightly larger stars
    const opacity = Math.random() * 0.6 + 0.1; // More visible stars
    
    const star = starGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", size)
      .attr("fill", "white")
      .attr("opacity", opacity);
      
    // Add twinkling to more stars
    if (Math.random() > 0.6) { // More twinkling stars
      star.append("animate")
        .attr("attributeName", "opacity")
        .attr("values", `${opacity};${opacity * 0.3};${opacity}`)
        .attr("dur", `${2 + Math.random() * 5}s`)
        .attr("repeatCount", "indefinite");
    }
  }
  
  return starGroup;
};
