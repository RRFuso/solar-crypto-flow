
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { createLinkTooltip, removeLinkTooltip } from './link-renderer/LinkTooltip';
import { stylizeLinks, createArrowheads } from './link-renderer/LinkStyling';
import { addFlowParticles } from './link-renderer/ParticleAnimation';

interface LinkRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  nodes?: any[]; // Add nodes as an optional prop to access their positions
  selectedNodeId?: string | null;
}

export class LinkRenderer {
  constructor(props: LinkRendererProps) {
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links, nodes, selectedNodeId }: LinkRendererProps) {
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
    
    // Update link positions if we have nodes information
    let updatedLinks = [...links];
    if (nodes && nodes.length > 0) {
      updatedLinks = links.map(link => {
        // Find source and target nodes by ID
        const sourceNode = typeof link.source === 'string' 
          ? nodes.find(n => n.id === link.source) 
          : link.source;
        
        const targetNode = typeof link.target === 'string'
          ? nodes.find(n => n.id === link.target)
          : link.target;
        
        if (sourceNode && targetNode) {
          return {
            ...link,
            source: sourceNode,
            target: targetNode
          };
        }
        return link;
      });
    }
    
    // Draw links with curved paths and hover effects
    const link = stylizeLinks(svg, linkGroup, updatedLinks, selectedNodeId, handleMouseOver, handleMouseOut);
    
    // Create arrowheads for directional flow
    createArrowheads(svg, updatedLinks);
    
    // Apply the markers to links
    link.attr("marker-end", d => `url(#${d.markerId})`);
    
    // Add animated particles for flow visualization
    addFlowParticles(svg, linkGroup, updatedLinks, selectedNodeId);
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
