
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';

export interface LinkRendererExtendedProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  selectedNodeId: string | null;
  predictions: Prediction[];
  animateWithOrbit?: boolean;
  getCategoryColor?: (category: string) => string;
}

// This is a wrapper component to extend the LinkRendererComponent with additional props
export const LinkRendererExtended: React.FC<LinkRendererExtendedProps> = ({
  svg,
  links,
  selectedNodeId,
  predictions,
  animateWithOrbit = false,
  getCategoryColor
}) => {
  // Get color based on category from backend
  const getColorForFlow = (category: string) => {
    if (getCategoryColor) {
      return getCategoryColor(category);
    }
    
    // Default color logic
    switch (category) {
      case "🚀 Alta":
        return "#00FF88"; // Bright green
      case "🏃 Fuga":
        return "#FF3366"; // Bright red
      case "🧱 Acum.":
        return "#FFCC00"; // Yellow
      case "🔁 Rev.":
        return "#00CCFF"; // Bright blue
      case "⚠️ Alert":
        return "#FF9900"; // Orange
      case "Neutro":
      default:
        return "#8A9196"; // Neutral gray
    }
  };
  
  useEffect(() => {
    if (!svg || !links || links.length === 0) return;

    // Clear previous links
    svg.selectAll(".flow-link").remove();

    // Create links with styling based on flow properties
    const linkGroup = svg
      .append("g")
      .attr("class", "flow-links")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "flow-link")
      .attr("id", (d) => `link-${d.source.id}-${d.target.id}`)
      .attr("d", (d) => {
        // Get the current positions from the data
        const sourceX = d.source.x || 0;
        const sourceY = d.source.y || 0;
        const targetX = d.target.x || 0;
        const targetY = d.target.y || 0;
        
        // Calculate control points for curved paths
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        
        return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      })
      .style("fill", "none")
      .style("stroke", (d) => {
        // Use the category to determine color
        const category = d.data?.category || "Neutro";
        return getColorForFlow(category);
      })
      .style("stroke-width", (d) => Math.max(1, Math.min(5, Math.abs(d.data?.value || 1) / 10)))
      .style("stroke-opacity", (d) => {
        // Dim links that are not connected to the selected node
        if (selectedNodeId && d.source.id !== selectedNodeId && d.target.id !== selectedNodeId) {
          return 0.2;
        }
        return 0.7;
      })
      .style("stroke-dasharray", (d) => {
        // Use dashed lines for negative flows
        const value = d.data?.value || 0;
        return value < 0 ? "5,5" : "none";
      });

    // Add animated particles for active links
    if (animateWithOrbit) {
      linkGroup.each(function(d) {
        const value = Math.abs(d.data?.value || 0);
        if (value > 0.5) { // Only add particles to significant flows
          const path = d3.select(this);
          const pathNode = path.node() as SVGPathElement;
          if (pathNode) {
            const pathLength = pathNode.getTotalLength();
            const numParticles = Math.min(5, Math.max(1, Math.floor(value / 5)));
            
            for (let i = 0; i < numParticles; i++) {
              svg.append("circle")
                .attr("class", "flow-particle")
                .attr("r", 2)
                .style("fill", path.style("stroke"))
                .style("opacity", 0.8)
                .append("animateMotion")
                .attr("dur", `${10 - Math.min(8, value / 3)}s`)
                .attr("repeatCount", "indefinite")
                .attr("path", path.attr("d"))
                .attr("rotate", "auto")
                .attr("begin", `${(i / numParticles) * 100}%`);
            }
          }
        }
      });
    }
  }, [svg, links, selectedNodeId, animateWithOrbit]);

  return null;
};

export default LinkRendererExtended;
