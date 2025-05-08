
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

    const particlesGroup = linkGroup.append("g").attr("class", "particles-group");

    const particles = processedLinks.map((link, i) => {
      const path = linkGroup
        .append("path")
        .attr("id", `link-path-${i}`)
        .attr("d", () => {
          const dx = link.target.x - link.source.x;
          const dy = link.target.y - link.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${link.source.x},${link.source.y}A${dr},${dr} 0 0,1 ${link.target.x},${link.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "none");

      const circle = particlesGroup.append("circle")
        .attr("r", 3)
        .attr("opacity", 0.8)
        .attr("fill", "red");

      return { link, path, circle, t: 0, speed: 0.005 + Math.random() * 0.005 };
    });

    const animateParticles = () => {
      particles.forEach(p => {
        p.t = (p.t + p.speed) % 1;
        const totalLength = p.path.node()?.getTotalLength() || 0;
        const point = p.path.node()?.getPointAtLength(p.t * totalLength);
        if (!point) return;
        p.circle.attr("transform", `translate(${point.x},${point.y})`);
        const color = d3.interpolateRgb("red", "green")(p.t);
        p.circle.attr("fill", color);
      });
      requestAnimationFrame(animateParticles);
    };

    animateParticles();

    if (animateWithOrbit) {
      const updateLinks = () => {
        link.attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        particles.forEach(p => {
          const dx = p.link.target.x - p.link.source.x;
          const dy = p.link.target.y - p.link.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          p.path.attr("d", `M${p.link.source.x},${p.link.source.y}A${dr},${dr} 0 0,1 ${p.link.target.x},${p.link.target.y}`);
        });
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
