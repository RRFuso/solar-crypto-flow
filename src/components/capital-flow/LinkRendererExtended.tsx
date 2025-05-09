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

    // === FLOW PARTICLE ANIMATION WITH COLOR TRANSITION ===
    const particlesGroup = linkGroup.append("g").attr("class", "particles-group");

    processedLinks.forEach((link, i) => {
      const path = particlesGroup
        .append("path")
        .attr("d", () => {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${link.source.x},${link.source.y}A${dr},${dr} 0 0,1 ${link.target.x},${link.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "none");

      const totalLength = path.node()?.getTotalLength() || 0;

      const circle = particlesGroup.append("circle")
        .attr("r", 3)
        .attr("opacity", 0.8);

      function animateParticle() {
        circle
          .transition()
          .duration(4000)
          .ease(d3.easeLinear)
          .attrTween("transform", () => {
            return (t: number) => {
              const point = path.node()?.getPointAtLength(t * totalLength);
              if (!point) return '';
              return `translate(${point.x},${point.y})`;
            };
          })
          .attrTween("fill", () => {
            return (t: number) => {
              const r = Math.round(255 * (1 - t));
              const g = Math.round(255 * t);
              return `rgb(${r},${g},0)`; // red → green
            };
          })
          .on("end", animateParticle);
      }

      animateParticle();
    });

    if (animateWithOrbit) {
      const updateLinks = () => {
        link.attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });

        svg.selectAll("linearGradient")
          .attr("x1", (d: any) => d?.source?.x || 0)
          .attr("y1", (d: any) => d?.source?.y || 0)
          .attr("x2", (d: any) => d?.target?.x || 0)
          .attr("y2", (d: any) => d?.target?.y || 0);

        requestAnimationFrame(updateLinks);
      };

      requestAnimationFrame(updateLinks);
    }

    return () => {
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  }, [svg, links, selectedNodeId, animateWithOrbit, getCategoryColor]);

  return null;
};

export default LinkRendererExtended;
