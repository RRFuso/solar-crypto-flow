
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
}

export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  useEffect(() => {
    const { svg, nodes, centralNode, selectedNodeId, zoomLevel } = props;

    svg.selectAll('.nodes-group').remove();

    const nodesGroup = svg.append("g").attr("class", "nodes-group");

    // Create defs for logos
    const defs = svg.append("defs");
    nodes.forEach(node => {
      const pattern = defs.append("pattern")
        .attr("id", `logo-${node.id}`)
        .attr("width", 1)
        .attr("height", 1);

      pattern.append("image")
        .attr("href", getCryptoLogoUrl(node.id))
        .attr("width", 50)
        .attr("height", 50)
        .on("error", function () {
          d3.select(this).attr("href", getFallbackLogoUrl());
        });
    });

    // Glow effect (circle)
    nodesGroup.selectAll("circle.node-glow")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node-glow")
      .attr("r", d => d.radius * 1.6 * (zoomLevel / 100))
      .attr("fill", d => {
        if (d.inflow > d.outflow) return 'rgba(0, 255, 204, 0.3)';
        if (d.outflow > d.inflow) return 'rgba(255, 0, 102, 0.3)';
        return 'rgba(0, 181, 216, 0.3)';
      })
      .attr("filter", "blur(8px)");

    // Main node group
    const node = nodesGroup.selectAll("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", d => d.id);

    node.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => d.radius * (zoomLevel / 100))
      .attr("fill", d => `url(#logo-${d.id})`)
      .attr("stroke", d => {
        if (d.inflow > d.outflow) return "#00ffcc";
        if (d.outflow > d.inflow) return "#ff0066";
        return "#00b5d8";
      })
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.9);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius * (zoomLevel / 100) + 14)
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .text(d => d.id);

    return () => {
      svg.selectAll(".nodes-group").remove();
    };
  }, [props]);

  return null;
});
