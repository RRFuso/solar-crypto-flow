
import * as d3 from 'd3';
import React, { useEffect } from 'react';

interface NodeData {
  id: string;
  inflow: number;
  outflow: number;
}

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NodeData[];
  width: number;
  height: number;
}

export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  svg,
  nodes,
  width,
  height,
}) => {
  useEffect(() => {
    if (!svg || nodes.length === 0) return;
    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;
    // Position central node at center
    svg.selectAll('.central-group')
      .attr('transform', `translate(${centerX},${centerY})`);
    // Data join for flow particles
    const flowDots = svg.selectAll<SVGCircleElement, NodeData>('circle.flow-dot')
      .data(nodes, d => d.id);
    const flowEnter = flowDots.enter()
      .append('circle')
      .attr('class', 'flow-dot')
      .attr('r', 4)
      .attr('pointer-events', 'none')
      .attr('fill', 'red');
    // Merge enter + existing
    const flowDotsMerged = flowEnter.merge(flowDots as any);
    flowDots.exit().remove();
    // Pre-calc for orbits
    const numNodes = nodes.length;
    const maxRadius = Math.min(width, height) * 0.4;
    const radiusStep = maxRadius / (numNodes + 1);
    const nodeIndex = new Map<string, number>();
    nodes.forEach((d, i) => {
      nodeIndex.set(d.id, i);
    });
    const initialAngles: number[] = nodes.map((d, i) => (2 * Math.PI * i) / numNodes);
    const radii: number[] = nodes.map((d, i) => radiusStep * (i + 1));
    const speed = 0.1; // radians per second
    const period = 5000; // 5 seconds for particle cycle
    const timer = d3.timer((elapsed) => {
      const t = elapsed / 1000;
      flowDotsMerged.each((d, i, elements) => {
        const idx = nodeIndex.get(d.id) as number;
        const angle = initialAngles[idx] + speed * t;
        const r = radii[idx];
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        // Move node group (circle + text) together
        svg.select(`.node-group[data-id='${d.id}']`)
          .attr('transform', `translate(${x},${y})`);
        // Update particle position and color
        const frac = (elapsed % period) / period;
        const dotX = centerX + r * Math.cos(angle) * frac;
        const dotY = centerY + r * Math.sin(angle) * frac;
        d3.select(elements[i])
          .attr('cx', dotX)
          .attr('cy', dotY)
          .attr('fill', d3.interpolateRgb('red', 'green')(frac));
      });
    });
    // Cleanup on unmount
    return () => {
      timer.stop();
    };
  }, [svg, nodes, width, height]);
  return null;
};
