
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { addFlowParticles } from './link-renderer/ParticleAnimation';
import { Prediction } from '@/lib/aiModel';

interface LinkRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  selectedNodeId?: string | null;
  predictions?: Prediction[];
  animateWithOrbit?: boolean; // New prop to control orbital animation
}

export class LinkRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private links: any[];
  
  constructor(props: LinkRendererProps) {
    this.svg = props.svg;
    this.links = props.links;
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links, selectedNodeId, predictions = [], animateWithOrbit = false }: LinkRendererProps) {
    // Clear any existing links first
    svg.selectAll('.links-group').remove();
    
    // Create links group
    const linkGroup = svg.append("g").attr("class", "links-group");
    
    // Handle link hover events
    const handleMouseOver = (event: MouseEvent, linkData: any) => {
      createLinkTooltip(svg, event, linkData);
    };
    
    const handleMouseOut = (event: MouseEvent, linkData: any) => {
      removeLinkTooltip(svg);
    };
    
    // Process links for visualization with prediction data
    const processedLinks = links.map(link => {
      // Find predictions for the source and target nodes
      const sourcePrediction = predictions?.find(p => p.symbol === link.source.id);
      const targetPrediction = predictions?.find(p => p.symbol === link.target.id);
      
      // Determine if this link should be colored based on predictions
      let predictionColor = null;
      
      // Color based on source prediction if it has high confidence
      if (sourcePrediction && sourcePrediction.confidence >= 0.6) {
        predictionColor = sourcePrediction.bullish ? "#00ff80" : "#ff3232"; // Neon green or neon red
      }
      // If target has higher confidence, use that
      if (targetPrediction && targetPrediction.confidence >= 0.6) {
        if (!predictionColor || targetPrediction.confidence > (sourcePrediction?.confidence || 0)) {
          predictionColor = targetPrediction.bullish ? "#00ff80" : "#ff3232";
        }
      }
      
      return {
        ...link,
        markerId: `marker-${link.source.id}-${link.target.id}`,
        predictionColor
      };
    });
    
    // Draw links with curved paths and hover effects
    const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, handleMouseOver, handleMouseOut);
    
    // Create arrowheads for directional flow
    createArrowheads(svg, processedLinks);
    
    // Apply the markers to links
    link.attr("marker-end", d => `url(#${d.markerId})`);
    
    // Add animated particles for flow visualization
    addFlowParticles(svg, linkGroup, processedLinks, selectedNodeId);
    
    // If orbital animation is enabled, update link positions in real-time
    if (animateWithOrbit) {
      this.setupLinkUpdates(linkGroup, processedLinks);
    }
  }
  
  // New method to update link positions with orbital movements
  private setupLinkUpdates(linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>, links: any[]) {
    const updateLinksPosition = () => {
      // Update each link path
      this.svg.selectAll("path.link-path")
        .attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
      
      // Update particle paths
      this.svg.selectAll(".particle")
        .attr("transform", function(d: any) {
          // Get the current position along the path
          const path = d3.select(d.pathElement).node();
          if (path) {
            const pathLength = path.getTotalLength();
            const point = path.getPointAtLength(d.progress * pathLength);
            return `translate(${point.x}, ${point.y})`;
          }
          return "";
        });
      
      // Request next animation frame
      requestAnimationFrame(updateLinksPosition);
    };
    
    // Start the animation loop
    requestAnimationFrame(updateLinksPosition);
  }
}

// Fix component export for Fast Refresh compatibility
export const LinkRendererComponent = React.memo((props: LinkRendererProps) => {
  useEffect(() => {
    const renderer = new LinkRenderer(props);
    
    // Cleanup
    return () => {
      props.svg.selectAll(".links-group").remove();
      props.svg.selectAll("defs").remove();
    };
  }, [props]);
  
  return null;
});
