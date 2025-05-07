
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface StarfieldBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
}

/**
 * Creates a starfield background for the visualization
 */
export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ svg, width, height }) => {
  useEffect(() => {
    // Clear existing starfields
    svg.selectAll('.starfield').remove();
    
    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 250; // Increased stars for better background effect
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.2;
      const opacity = Math.random() * 0.5 + 0.2;
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
    } // Added missing closing curly brace for the first for loop
     
    // Add a few distant "galaxies" (blurred star clusters)
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const galaxySize = 20 + Math.random() * 40;
      
      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", galaxySize)
        .attr("fill", "rgba(100, 100, 150, 0.02)")
        .attr("filter", "blur(8px)");
    }
    
    return () => {
      svg.selectAll('.starfield').remove();
    };
  }, [svg, width, height]);
  
  return null;
};
