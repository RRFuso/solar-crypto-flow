
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';

export interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  nodes: any[];
  selectedNodeId: string | null;
  predictions: Prediction[];
  animateWithOrbit?: boolean;
  getCategoryColor?: (category: string) => string;
}

export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  nodes,
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
    if (!svg || !links || links.length === 0 || !nodes || nodes.length === 0) return;

    svg.selectAll(".flow-links").remove();
    svg.selectAll(".particles-group").remove();

    const linkGroup = svg.append("g").attr("class", "flow-links");

    // Ensure links have valid source and target nodes with current positions
    const processedLinks = links.map(link => {
      const sourceNode = nodes.find(n => n.id === link.source?.id || n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target?.id || n.id === link.target);
      
      if (!sourceNode || !targetNode) {
        console.warn('Link missing valid source or target node:', link);
        return null;
      }

      return {
        ...link,
        source: sourceNode,
        target: targetNode,
        markerId: `marker-${sourceNode.id}-${targetNode.id}`,
        categoryColor: link.data?.category ? getColorForFlow(link.data.category) : null
      };
    }).filter(Boolean);

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

    let animationFrameId: number | null = null;

    if (animateWithOrbit) {
      const updateAll = () => {
        // Update line paths using current node positions
        link.attr("d", (d: any) => {
          if (!d.source || !d.target || 
              typeof d.source.x !== 'number' || typeof d.source.y !== 'number' ||
              typeof d.target.x !== 'number' || typeof d.target.y !== 'number') {
            return "";
          }

          // Use straight lines for debugging connection issues
          return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        });

        // Update particles with new positions
        particles.forEach(({ circle, link, path }) => {
          if (!link.source || !link.target || 
              typeof link.source.x !== 'number' || typeof link.source.y !== 'number' ||
              typeof link.target.x !== 'number' || typeof link.target.y !== 'number') {
            return;
          }

          const pathD = `M${link.source.x},${link.source.y}L${link.target.x},${link.target.y}`;
          path.attr("d", pathD);

          const totalLength = path.node()?.getTotalLength() || 0;
          if (totalLength > 0) {
            const t = ((Date.now() % 4000) / 4000);
            const point = path.node()?.getPointAtLength(t * totalLength);

            if (point) {
              circle.attr("transform", `translate(${point.x},${point.y})`);
              const r = Math.round(255 * (1 - t));
              const g = Math.round(255 * t);
              circle.attr("fill", `rgb(${r},${g},0)`);
            }
          }
        });

        animationFrameId = requestAnimationFrame(updateAll);
      };

      animationFrameId = requestAnimationFrame(updateAll);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  }, [svg, links, nodes, selectedNodeId, animateWithOrbit, getCategoryColor]);

  return null;
};

export default LinkRendererExtended;
