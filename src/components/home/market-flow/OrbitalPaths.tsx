
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

  // Draw orbit paths
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
