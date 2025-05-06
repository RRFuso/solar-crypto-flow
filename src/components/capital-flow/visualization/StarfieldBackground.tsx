
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface StarfieldBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
}

/**
 * Creates a lightweight static starfield background for the visualization.
 */
export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ svg, width, height }) => {
  useEffect(() => {
    // Clear existing starfields
    svg.selectAll('.starfield').remove();

    const starGroup = svg.append("g").attr("class", "starfield");
    const numStars = 10; // Reduced for better performance

    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.2 + 0.3;
      const opacity = Math.random() * 0.4 + 0.3;

      starGroup.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", size)
        .attr("fill", "white")
        .attr("opacity", opacity);
    }

    return () => {
      svg.selectAll('.starfield').remove();
    };
  }, [svg, width, height]);

  return null;
};
