
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface StarfieldBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  showLines: boolean;
}

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({ svg, width, height, showLines }) => {
  useEffect(() => {
    svg.selectAll('.starfield').remove();

    if (showLines) {
      // If lines are shown, do not render the starfield.
      return;
    }

    const starfield = svg.append('g').attr('class', 'starfield');
    const numStars = 200; // A reasonable number of stars
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    }));

    starfield.selectAll('.star')
      .data(stars)
      .enter()
      .append('circle')
      .attr('class', 'star')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .style('fill', 'white')
      .style('fill-opacity', 0.7);

    return () => {
      svg.selectAll('.starfield').remove();
    };
  }, [svg, width, height, showLines]);

  return null;
};
