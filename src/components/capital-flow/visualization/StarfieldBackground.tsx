
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
    const numStars = 0; // Increased stars for better background effect
    
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.2;
      const opacity = Math.random() * 0.5 + 0.2;
      
      const star = starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
        
      // Add twinkling effect to some stars
      if (Math.random() > 0.7) {
        star.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${opacity};${opacity * 0.5};${opacity}`)
          .attr("dur", `${2 + Math.random() * 4}s`)
          .attr("repeatCount", "indefinite");
      }
    }
    
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
