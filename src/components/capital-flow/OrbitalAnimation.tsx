
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

export const OrbitalAnimationComponent = React.memo((props: OrbitalAnimationProps) => {
  const animationRef = useRef<number>();

  useEffect(() => {
    const { svg, nodes, width, height, rotationSpeed = 0.00012, updateLinksInRealTime = true } = props;

    const central = nodes.find(n => n.type === 'central');
    const orbiters = nodes.filter(n => n.type !== 'central');

    function animate() {
      orbiters.forEach(node => {
        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const angle = Math.atan2(dy, dx) + rotationSpeed;
        const radius = Math.sqrt(dx * dx + dy * dy);

        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      });

      // Sync elements
      svg.selectAll("g.node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

      svg.selectAll("circle.node-glow")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      if (updateLinksInRealTime) {
        svg.selectAll("path.link-path")
          .attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          });

        svg.selectAll("linearGradient")
          .each(function (d: any) {
            if (!d.source || !d.target) return;
            d3.select(this)
              .attr("x1", d.source.x)
              .attr("y1", d.source.y)
              .attr("x2", d.target.x)
              .attr("y2", d.target.y);
          });
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [props]);

  return null;
});
