
import React, { useEffect } from 'react';
import * as d3 from 'd3';
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
  private animationFrameId: number | null = null;
  
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
    
    // Process links for visualization with prediction data
    const processedLinks = links.map(link => {
      // Find predictions for the source and target nodes
      const sourcePrediction = predictions?.find(p => p.symbol === link.source.id);
      const targetPrediction = predictions?.find(p => p.symbol === link.target.id);
      
      // Determine if this link should be colored based on predictions
      let predictionColor = null;
      
      // Color based on source prediction if it has high confidence
      if (sourcePrediction && sourcePrediction.confidence >= 0.6) {
        predictionColor = sourcePrediction.direction === 'bullish' ? "#00ff80" : "#ff3232"; // Neon green or neon red
      }
      // If target has higher confidence, use that
      if (targetPrediction && targetPrediction.confidence >= 0.6) {
        if (!predictionColor || targetPrediction.confidence > (sourcePrediction?.confidence || 0)) {
          predictionColor = targetPrediction.direction === 'bullish' ? "#00ff80" : "#ff3232";
        }
      }
      
      return {
        ...link,
        markerId: `marker-${link.source.id}-${link.target.id}`,
        predictionColor,
        isHighlighted: selectedNodeId ? (link.source.id === selectedNodeId || link.target.id === selectedNodeId) : true
      };
    });
    
    // Draw links with curved paths and hover effects
    const link = stylizeLinks(svg, linkGroup, processedLinks, selectedNodeId, () => {}, () => {});
    
    // Create arrowheads for directional flow
    createArrowheads(svg, processedLinks);
    
    // Apply the markers to links
    link.attr("marker-end", d => `url(#${d.markerId})`);
    
    // Add animated particles for flow visualization
    addFlowParticles(svg, linkGroup, processedLinks, selectedNodeId);
    
    // If orbital animation is enabled, update link positions in real-time
    if (animateWithOrbit) {
      this.setupLinkUpdates(linkGroup, processedLinks, selectedNodeId);
    }
  }
  
  // New method to update link positions with orbital movements
  private setupLinkUpdates(linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>, links: any[], selectedNodeId: string | null) {
    // Cancel any existing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    const updateLinksPosition = () => {
      // Update each link path
      this.svg.selectAll("path.link-path")
        .attr("d", (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        })
        .attr("opacity", (d: any) => {
          if (selectedNodeId) {
            return d.source.id === selectedNodeId || d.target.id === selectedNodeId ? 0.9 : 0.15;
          }
          return d.predictionColor ? 0.9 : 0.6;
        });
      
      // Update link gradients
      this.svg.selectAll("linearGradient")
        .attr("x1", (d: any) => d?.source?.x || 0)
        .attr("y1", (d: any) => d?.source?.y || 0)
        .attr("x2", (d: any) => d?.target?.x || 0)
        .attr("y2", (d: any) => d?.target?.y || 0);
      
      // Update arrowheads position
      this.svg.selectAll("marker")
        .attr("refX", (d: any) => {
          // Adjust refX based on target node radius
          return 8 + (d?.target?.radius || 20) * 0.8;
        });
      
      // Continue animation
      this.animationFrameId = requestAnimationFrame(updateLinksPosition);
    };
    
    // Start animation
    this.animationFrameId = requestAnimationFrame(updateLinksPosition);
  }
  
  public cleanup() {
    // Cancel any active animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

// Fix component export for Fast Refresh compatibility
export const LinkRendererComponent = React.memo((props: LinkRendererProps) => {
  useEffect(() => {
    const renderer = new LinkRenderer(props);
    
    // Cleanup on unmount or when props change
    return () => {
      renderer.cleanup();
      props.svg.selectAll(".links-group").remove();
      props.svg.selectAll("defs").remove();
    };
  }, [props]);
  
  return null;
});
