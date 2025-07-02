
import React from 'react';
import * as d3 from 'd3';
import { MarketIndex } from '@/types/indices';
import { createNodePatterns } from './createNodePatterns';
import { createNodeVisuals } from './createNodeVisuals';
import { createNodeText } from './createNodeText';
import { createNodeTooltips } from './createNodeTooltips';

interface NodeElementsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
}

export const createNodeElements = (props: NodeElementsProps) => {
  const { svg, nodes } = props;

  // Create patterns for logos
  createNodePatterns(svg, nodes);
  
  // Draw nodes (circles)
  const node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
  
  // Add visual elements (circles, gradients, logos)
  createNodeVisuals(svg, node);
  
  // Add text elements (ticker, percentage)
  createNodeText(node);
  
  // Add tooltips
  createNodeTooltips(svg, node);

  return node;
};
