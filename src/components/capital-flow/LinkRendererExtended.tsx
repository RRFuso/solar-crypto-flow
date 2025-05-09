
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { addFlowParticles } from './link-renderer/ParticleAnimation';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';

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
    svg.selectAll(".flow-links").remove();

    // Create links with styling based on flow properties
    const linkGroup = svg
      .append("g")
      .attr("class", "flow-links");

    // Process links to add required properties
    const processedLinks = links.map(link => ({
      ...link,
      markerId: `marker-${link.source.id}-${link.target.id}`,
      categoryColor: link.data?.category ? getColorForFlow(link.data.category) : null
    }));
    
    // Handle mouse events
    const handleMouseOver = (event: MouseEvent, linkData: any) => {
      createLinkTooltip(svg, event, linkData);
    };
    
    const handleMouseOut = () => {
      removeLinkTooltip(svg);
    };

    // Apply link styling with dashed, animated lines
    const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut);
    
    // Create arrowheads for directional flow
    createArrowheads(svg, processedLinks);
    
    // Add animated flow particles
    addFlowParticles(svg, linkGroup, processedLinks, selectedNodeId);
    
    // Set up animation for link position updates if nodes are moving
    if (animateWithOrbit) {
      const updateLinks = () => {
        // Update path positions based on current node positions
        link.attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        
        // Update gradient positions
        svg.selectAll("linearGradient")
          .attr("x1", (d: any) => d?.source?.x || 0)
          .attr("y1", (d: any) => d?.source?.y || 0)
          .attr("x2", (d: any) => d?.target?.x || 0)
          .attr("y2", (d: any) => d?.target?.y || 0);
          
        requestAnimationFrame(updateLinks);
      };
      
      // Start the animation loop
      requestAnimationFrame(updateLinks);
    }
    
    // Cleanup function
    return () => {
      svg.selectAll(".flow-links").remove();
      svg.selectAll(".particles-group").remove();
    };
  }, [svg, links, selectedNodeId, animateWithOrbit, getCategoryColor]);

  return null;
};

export default LinkRendererExtended;
