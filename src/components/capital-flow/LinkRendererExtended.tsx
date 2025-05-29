import * as d3 from 'd3';
import React, { useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';

interface LinkRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  selectedNodeId: string | null;
  predictionsMap: Map<string, Prediction>;
}

export const LinkRendererExtended: React.FC<LinkRendererProps> = ({
  svg,
  links,
  selectedNodeId,
  predictionsMap
}) => {
  useEffect(() => {
    if (!svg || !links) return;

    // Clean previous render
    svg.selectAll('.dynamic-link').remove();

    const linkGroup = svg.append('g').attr('class', 'dynamic-link');

    // Draw dynamic links
    links.forEach(link => {
      const source = link.source;
      const target = link.target;

      const prediction = predictionsMap.get(target.id);
      const confidence = prediction?.confidence || 0.5;
      const bullish = prediction?.bullish ?? true;

      const strength = confidence;
      const color = bullish ? d3.interpolateGreens(confidence) : d3.interpolateReds(confidence);

      linkGroup
        .append('line')
        .attr('x1', source.x)
        .attr('y1', source.y)
        .attr('x2', target.x)
        .attr('y2', target.y)
        .attr('stroke', color)
        .attr('stroke-opacity', selectedNodeId === target.id ? 1 : 0.6)
        .attr('stroke-width', 1.5 + strength * 2)
        .attr('pointer-events', 'none');
    });

    return () => {
      svg.selectAll('.dynamic-link').remove();
    };
  }, [svg, links, selectedNodeId, predictionsMap]);

  return null;
};
