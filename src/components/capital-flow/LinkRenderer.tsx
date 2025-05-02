
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
}

export class LinkRenderer {
  constructor(props: LinkRendererProps) {
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links, selectedNodeId, predictions = [] }: LinkRendererProps) {
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
  }
}

// Fix component export for Fast Refresh compatibility
export const LinkRendererComponent = React.memo((props: LinkRendererProps) => {
  useEffect(() => {
    new LinkRenderer(props);
    
    // Cleanup
    return () => {
      props.svg.selectAll(".links-group").remove();
      props.svg.selectAll("defs").remove();
    };
  }, [props]);
  
  return null;
});
