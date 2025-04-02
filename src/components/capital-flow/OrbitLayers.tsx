
import React from 'react';
import * as d3 from 'd3';

interface OrbitLayersProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export const OrbitLayers: React.FC<OrbitLayersProps> = ({ 
  svg, 
  width, 
  height, 
  orbitLayers, 
  baseRadius 
}) => {
  React.useEffect(() => {
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      const orbitRadius = i * baseRadius;
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
    }
  }, [svg, width, height, orbitLayers, baseRadius]);

  return null;
};
