
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';

export interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  selectedNodeId: string | null;
  predictions: Prediction[];
  animateWithOrbit?: boolean;
  getCategoryColor?: (category: string) => string;
}

export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  selectedNodeId,
  predictions,
  animateWithOrbit = false,
  getCategoryColor
}) => {
  const getColorForFlow = (category: string) => {
    if (getCategoryColor) {
      return getCategoryColor(category);
    }
    switch (category) {
      case "🚀 Alta": return "#00FF88";
      case "🏃 Fuga": return "#FF3366";
      case "🧱 Acum.": return "#FFCC00";
      case "🔁 Rev.": return "#00CCFF";
      case "⚠️ Alert": return "#FF9900";
      default: return "#8A9196";
    }
  };

  useEffect(() => {
    if (!svg || !links || links.length === 0) return;

    svg.selectAll(".flow-links").remove();
    svg.selectAll(".particles-group").remove();

    const linkGroup = svg.append("g").attr("class", "flow-links");

    const processedLinks = links.map(link => ({
      ...link,
      markerId: `marker-${link.source.id}-${link.target.id}`,
      categoryColor: link.data?.category ? getColorForFlow(link.data.category) : null
    }));

    const handleMouseOver = (event: MouseEvent, linkData: any) => {
      createLinkTooltip(svg, event, linkData);
    };

    const handleMouseOut = () => {
      removeLinkTooltip(svg);
    };

    const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut);
    createArrowheads(svg, processedLinks);

    // === PARTICLE ANIMATION SETUP (DYNAMIC) ===
    const particlesGroup = linkGroup.append("g").attr("class", "particles-group");
    const particles: {
      circle: d3.Selection<SVGCircleElement, unknown, null, undefined>;
      link: any;
      path: d3.Selection<SVGPathElement, unknown, null, undefined>;
    }[] = [];

    processedLinks.forEach(link => {
      const path = particlesGroup.append("path")
        .attr("fill", "none")
        .attr("stroke", "none");

      const circle = particlesGroup.append("circle")
        .attr("r", 3)
        .attr("opacity", 0.9);

      particles.push({ circle, link, path });
    });

    if (animateWithOrbit) {
      const updateAll = () => {
        // Update line paths (curved)
        link.attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        // Update particles with new orbital positions
        particles.forEach(({ circle, link, path }) => {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          const pathD = `M${link.source.x},${link.source.y}A${dr},${dr} 0 0,1 ${link.target.x},${link.target.y}`;
          path.attr("d", pathD);

          const totalLength = path.node()?.getTotalLength() || 0;
          const t = ((Date.now() % 4000) / 4000); // 4s loop
          const point = path.node()?.getPointAtLength(t * totalLength);

          if (point) {
            circle.attr("transform", `translate(${point.x},${point.y})`);
            const r = Math.round(255 * (1 - t));
            const g = Math.round(255 * t);
            circle.attr("fill", `rgb(${r},${g},0)`); // red → green
          }
        });

        requestAnimationFrame(updateAll);
      };

      requestAnimationFrame(updateAll);
    }

    return () => {
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  }, [svg, links, selectedNodeId, animateWithOrbit, getCategoryColor]);

  return null;
};

export default LinkRendererExtended;
