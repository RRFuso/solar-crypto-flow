import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { FlowLink } from '@/types/flow';
import { getCryptoColor } from '@/lib/colors';

interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: FlowLink[];
  selectedNodeId?: string | null;
}

export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({ svg, links, selectedNodeId }) => {
  useEffect(() => {
    if (!svg || !links) return;

    svg.selectAll('.flow-link-group').remove();

    const linkGroup = svg.append('g').attr('class', 'flow-link-group');

    links.forEach((link, index) => {
      const { source, target, value, netFlow } = link;

      const path = linkGroup
        .append('line')
        .attr('class', 'flow-line')
        .attr('x1', source.x)
        .attr('y1', source.y)
        .attr('x2', target.x)
        .attr('y2', target.y)
        .attr('stroke', 'rgba(255,255,255,0.05)')
        .attr('stroke-width', Math.max(1, Math.log10(Math.abs(value) + 1)));

      const numParticles = Math.min(5, Math.floor(Math.abs(value) / 10_000_000)); // define quantidade com base no volume
      const flowDirection = netFlow > 0 ? 1 : -1;
      const color = netFlow > 0 ? '#00ff88' : '#ff3344';

      for (let i = 0; i < numParticles; i++) {
        const particle = linkGroup
          .append('circle')
          .attr('class', 'flow-particle')
          .attr('r', 2)
          .attr('fill', color)
          .attr('cx', source.x)
          .attr('cy', source.y)
          .attr('opacity', 0.8);

        const totalLength = Math.hypot(target.x - source.x, target.y - source.y);
        const speedFactor = Math.max(0.5, Math.min(3, Math.abs(netFlow) / 1_000_000)); // velocidade relativa

        const animateParticle = () => {
          particle
            .transition()
            .duration(4000 / speedFactor)
            .ease(d3.easeLinear)
            .attrTween('cx', () => d3.interpolate(source.x, target.x))
            .attrTween('cy', () => d3.interpolate(source.y, target.y))
            .on('end', () => {
              particle.attr('cx', source.x).attr('cy', source.y);
              animateParticle(); // loop
            });
        };

        setTimeout(animateParticle, i * 500); // espalhar no tempo
      }
    });

    return () => {
      svg.selectAll('.flow-link-group').remove();
    };
  }, [svg, links, selectedNodeId]);

  return null;
};

export default LinkRendererExtended;
