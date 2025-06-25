
import React, { useEffect } from 'react';
import { Prediction } from '@/lib/aiModel';

interface LinkRendererProps {
  svg: SVGSVGElement;
  links: any[];
  selectedNodeId?: string | null;
  predictions?: Prediction[];
  animateWithOrbit?: boolean;
}

export class LinkRenderer {
  private svg: SVGSVGElement;
  private links: any[];
  private animationFrameId: number | null = null;
  
  constructor(props: LinkRendererProps) {
    this.svg = props.svg;
    this.links = props.links;
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links, selectedNodeId, predictions = [], animateWithOrbit = false }: LinkRendererProps) {
    // Clear existing links
    const existingLinks = svg.querySelectorAll('.links-group');
    existingLinks.forEach(el => el.remove());
    
    // Create links group
    const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linkGroup.setAttribute("class", "links-group");
    svg.appendChild(linkGroup);
    
    // Process links for visualization with prediction data
    const processedLinks = links.map(link => {
      // Find predictions for the source and target nodes
      const sourcePrediction = predictions?.find(p => p.symbol === link.source.id);
      const targetPrediction = predictions?.find(p => p.symbol === link.target.id);
      
      // Determine if this link should be colored based on predictions
      let predictionColor = null;
      
      // Color based on source prediction if it has high confidence
      if (sourcePrediction && sourcePrediction.confidence >= 0.6) {
        predictionColor = sourcePrediction.bullish ? "#00ff80" : "#ff3232";
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
        predictionColor,
        isHighlighted: selectedNodeId ? (link.source.id === selectedNodeId || link.target.id === selectedNodeId) : true
      };
    });
    
    // Create defs for markers
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);
    
    // Draw links with curved paths
    processedLinks.forEach(link => {
      if (!link.source || !link.target) return;
      
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
      arrowPath.setAttribute("fill", link.predictionColor || "#4ade80");
      arrowPath.setAttribute("d", "M0,-5L10,0L0,5");
      marker.appendChild(arrowPath);
      defs.appendChild(marker);
      
      // Create link path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "link-path");
      const dx = (link.target.x || 0) - (link.source.x || 0);
      const dy = (link.target.y || 0) - (link.source.y || 0);
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
      const pathData = `M${link.source.x || 0},${link.source.y || 0}A${dr},${dr} 0 0,1 ${link.target.x || 0},${link.target.y || 0}`;
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", link.predictionColor || "#4ade80");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("opacity", link.isHighlighted ? "0.8" : "0.3");
      path.setAttribute("marker-end", `url(#${link.markerId})`);
      
      linkGroup.appendChild(path);
    });
  }
  
  public cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export const LinkRendererComponent = React.memo((props: LinkRendererProps) => {
  useEffect(() => {
    const renderer = new LinkRenderer(props);
    
    return () => {
      renderer.cleanup();
      const existingLinks = props.svg.querySelectorAll(".links-group, defs");
      existingLinks.forEach(el => el.remove());
    };
  }, [props]);
  
  return null;
});
