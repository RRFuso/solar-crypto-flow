import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface StarfieldBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  showLines: boolean;
}

// Stars are generated once and stored outside the component.
// On resize the same stars are repositioned via percentage, avoiding
// the cost of DOM re-creation.
function buildStars(count: number) {
  return Array.from({ length: count }, () => ({
    xPct: Math.random(), // 0-1 percentage of width
    yPct: Math.random(), // 0-1 percentage of height
    r:    Math.random() * 1.2 + 0.4,
    o:    Math.random() * 0.5 + 0.3,
  }));
}

const STAR_COUNT = 80;
const starData   = buildStars(STAR_COUNT); // computed once per module load

export const StarfieldBackground: React.FC<StarfieldBackgroundProps> = ({
  svg, width, height, showLines,
}) => {
  const renderedRef = useRef(false);

  useEffect(() => {
    if (showLines) {
      svg.selectAll('.starfield').remove();
      renderedRef.current = false;
      return;
    }

    if (!width || !height) return;

    if (!renderedRef.current) {
      // First render: create DOM elements once
      svg.selectAll('.starfield').remove();
      const g = svg.append('g').attr('class', 'starfield');

      g.selectAll('.star')
        .data(starData)
        .enter()
        .append('circle')
        .attr('class', 'star')
        .attr('cx',      d => d.xPct * width)
        .attr('cy',      d => d.yPct * height)
        .attr('r',       d => d.r)
        .attr('fill',    'white')
        .attr('opacity', d => d.o);

      renderedRef.current = true;
    } else {
      // Subsequent renders: only reposition (no DOM creation)
      svg.select('.starfield').selectAll<SVGCircleElement, typeof starData[0]>('.star')
        .attr('cx', d => d.xPct * width)
        .attr('cy', d => d.yPct * height);
    }

    return () => {
      // Only remove on unmount (showLines handled at top of effect)
    };
  }, [svg, width, height, showLines]);

  return null;
};
