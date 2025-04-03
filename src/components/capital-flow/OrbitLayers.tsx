
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface OrbitLayersProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export class OrbitLayers {
  constructor(props: OrbitLayersProps) {
    this.renderOrbits(props);
  }
  
  private renderOrbits({ svg, width, height, orbitLayers, baseRadius }: OrbitLayersProps) {
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      const orbitRadius = i * baseRadius * 1.5; // Increased spacing for better separation
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
    }
  }
}

export const OrbitLayersComponent: React.FC<OrbitLayersProps> = (props) => {
  useEffect(() => {
    new OrbitLayers(props);
  }, [props]);
  
  return null;
};
