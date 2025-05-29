// src/components/capital-flow/OrbitalAnimation.tsx
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { CryptoNode } from '@/types/crypto';

interface Props {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: CryptoNode[];
  width: number;
  height: number;
}

export const OrbitalAnimationComponent: React.FC<Props> = ({ svg, nodes, width, height }) => {
  useEffect(() => {
    let frameId: number;
    const centerX = width / 2;
    const centerY = height / 2;

    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(nodes, d => d.orbit || 1) || 1])
      .range([40, 300]);

    const animate = () => {
      nodes.forEach(node => {
        const angle = (Date.now() / (5000 + node.orbit * 1000)) % (2 * Math.PI);
        const radius = radiusScale(node.orbit);
        node.x = centerX + radius * Math.cos(angle + node.orbit);
        node.y = centerY + radius * Math.sin(angle + node.orbit);
      });
      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, [svg, nodes, width, height]);

  return null;
};
