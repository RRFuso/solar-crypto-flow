// src/components/capital-flow/LinkRenderer.tsx
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowLink } from '@/types/crypto';

interface Props {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: FlowLink[];
  selectedNodeId: string | null;
}

export const LinkRendererComponent: React.FC<Props> = ({ svg, links, selectedNodeId }) => {
  useEffect(() => {
    svg.selectAll('.flow-link').remove();

    const linkGroup = svg.append('g').attr('class', 'flow-link');

    links.forEach(link => {
      const line = linkGroup.append('line')
        .attr('x1', link.source.x)
        .attr('y1', link.source.y)
        .attr('x2', link.target.x)
        .attr('y2', link.target.y)
        .attr('stroke', link.value > 0 ? '#00ff80' : '#ff4444')
        .attr('stroke-width', Math.max(1, Math.abs(link.value) / 10));

      const particle = linkGroup.append('circle')
        .attr('r', 3)
        .attr('fill', '#ffffff');

      animateParticle(particle, link);
    });

    return () => svg.selectAll('.flow-link').remove();
  }, [svg, links]);

  const animateParticle = (circle: d3.Selection<SVGCircleElement, unknown, null, undefined>, link: FlowLink) => {
    const duration = 6000 - Math.min(5000, Math.abs(link.value) * 50);
    function move() {
      circle
        .attr('cx', link.source.x)
        .attr('cy', link.source.y)
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('cx', link.target.x)
        .attr('cy', link.target.y)
        .on('end', move);
    }
    move();
  };

  return null;
};
