
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
    // Clear any existing orbit circles first
    svg.selectAll(".orbit-circle").remove();
    
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      const orbitRadius = i * baseRadius * 2; // Increased spacing for better separation
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
  }
}

export const OrbitLayersComponent: React.FC<OrbitLayersProps> = (props) => {
  useEffect(() => {
    new OrbitLayers(props);
    
    // Cleanup
    return () => {
      props.svg.selectAll(".orbit-circle").remove();
    };
  }, [props]);
  
  return null;
};
