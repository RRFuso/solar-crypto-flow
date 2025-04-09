
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface LinkRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
  selectedNodeId?: string | null;
}

export class LinkRenderer {
  constructor(props: LinkRendererProps) {
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links, selectedNodeId }: LinkRendererProps) {
    // Clear any existing links first
    svg.selectAll('.links-group').remove();
    
    // Create links group
    const linkGroup = svg.append("g").attr("class", "links-group");
    
    // Draw links with curved paths
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d => {
        // Create curved paths between nodes
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      })
      .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e") // Green for positive flow, red for negative
      .attr("stroke-width", d => {
        // Calculate base width based on flow value
        const baseWidth = 1 + Math.min(4, Math.abs(d.value));
        
        // If this link is connected to the selected node, make it wider
        if (selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)) {
          return baseWidth * 2;
        }
        return baseWidth;
      })
      .attr("fill", "none")
      .attr("stroke-dasharray", "6,6")
      .attr("opacity", d => {
        // If a node is selected, fade links that don't involve it
        if (selectedNodeId && d.source.id !== selectedNodeId && d.target.id !== selectedNodeId) {
          return 0.2;
        }
        return 0.7;
      });
    
    // Create arrowheads for directional flow
    const defs = svg.append("defs");
    
    // Create a unique arrow marker for each link
    links.forEach((link, i) => {
      const markerId = `arrowhead-${i}`;
      const color = link.percentage > 0 ? "#4ade80" : "#f43f5e";
      
      defs.append("marker")
        .attr("id", markerId)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22) // Position the arrowhead away from the target
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color);
      
      // Apply the marker to the link
      link.markerId = markerId;
    });
    
    link.attr("marker-end", d => `url(#${d.markerId})`);
    
    // Add animated particles along the links for flow visualization
    links.forEach((link, i) => {
      if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
        return; // Skip animation for links not connected to selected node
      }
      
      const numParticles = Math.min(5, Math.max(2, Math.floor(Math.abs(link.value))));
      const particleGroup = linkGroup.append("g").attr("class", "particles");
      
      for (let j = 0; j < numParticles; j++) {
        particleGroup.append("circle")
          .attr("class", "particle")
          .attr("r", 2)
          .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
          .attr("opacity", 0.7);
      }
      
      // Animate particles along path
      const linkNode = link;
      const particleNodes = particleGroup.selectAll(".particle");
      const pathElement = linkGroup.select(`.link:nth-child(${i + 1})`).node();
      
      if (pathElement) {
        const pathLength = (pathElement as SVGPathElement).getTotalLength();
        
        function animateParticles() {
          particleNodes.each(function(d, j) {
            // Calculate position along path based on time
            const offset = ((Date.now() / 2000) + (j / numParticles)) % 1;
            // Get the point at specified position along the path
            const point = (pathElement as SVGPathElement).getPointAtLength(offset * pathLength);
            
            // Update particle position
            d3.select(this)
              .attr("cx", point.x)
              .attr("cy", point.y);
          });
          
          requestAnimationFrame(animateParticles);
        }
        
        animateParticles();
      }
    });
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
