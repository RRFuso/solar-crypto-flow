
import React, { useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';

export interface LinkRendererExtendedProps {
  svg: SVGSVGElement;
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

    // Clear existing links using native DOM methods
    const existingLinks = svg.querySelectorAll('.flow-links, .particles-group');
    existingLinks.forEach(el => el.remove());

    const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linkGroup.setAttribute("class", "flow-links");
    svg.appendChild(linkGroup);

    // Process links
    const processedLinks = links.map(link => {
      const sourceNode = nodes.find(n => n.id === link.source?.id || n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target?.id || n.id === link.target);
      
      if (!sourceNode || !targetNode) {
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

    // Create defs for gradients and markers
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);

    // Create links
    processedLinks.forEach((link, index) => {
      if (!link.source || !link.target) return;

      // Create gradient
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      gradient.setAttribute("id", `link-gradient-${index}`);
      gradient.setAttribute("x1", link.source.x?.toString() || "0");
      gradient.setAttribute("y1", link.source.y?.toString() || "0");
      gradient.setAttribute("x2", link.target.x?.toString() || "0");
      gradient.setAttribute("y2", link.target.y?.toString() || "0");

      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", link.categoryColor || "#4ade80");

      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", link.categoryColor || "#06b6d4");

      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      defs.appendChild(gradient);

      // Create marker
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", link.markerId);
      marker.setAttribute("viewBox", "0 -5 10 10");
      marker.setAttribute("refX", "8");
      marker.setAttribute("refY", "0");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto");

      const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arrowPath.setAttribute("fill", link.categoryColor || "#4ade80");
      arrowPath.setAttribute("d", "M0,-5L10,0L0,5");
      marker.appendChild(arrowPath);
      defs.appendChild(marker);

      // Create link path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "link-path");
      const pathData = `M${link.source.x || 0},${link.source.y || 0}L${link.target.x || 0},${link.target.y || 0}`;
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", `url(#link-gradient-${index})`);
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("opacity", selectedNodeId ? 
        (link.source.id === selectedNodeId || link.target.id === selectedNodeId ? "0.8" : "0.2") : 
        "0.6"
      );
      path.setAttribute("marker-end", `url(#${link.markerId})`);

      linkGroup.appendChild(path);
    });

    // Cleanup function
    return () => {
      const linksToRemove = svg.querySelectorAll('.flow-links, .particles-group');
      linksToRemove.forEach(el => el.remove());
    };
  }, [svg, links, nodes, selectedNodeId, animateWithOrbit, getCategoryColor]);

  return null;
};

export default LinkRendererExtended;
