
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
        // Calculate base width based on flow value - thicker for more significant flows
        const baseWidth = 1 + Math.min(8, Math.abs(d.value));
        
        // If this link is connected to the selected node, make it wider
        if (selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId)) {
          return baseWidth * 1.5;
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
      
    // Add hover effect and tooltip to links
    link.on("mouseover", function(event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke-width", d => 2 + Math.min(8, Math.abs(d.value)))
          .attr("filter", "url(#glow-filter)");
          
        // Show tooltip with flow details
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${event.offsetX},${event.offsetY - 40})`);
        
        tooltip.append("rect")
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("x", -80)
          .attr("y", -40)
          .attr("width", 160)
          .attr("height", 55)
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("stroke", d.percentage > 0 ? "#4ade80" : "#f43f5e")
          .attr("stroke-width", 1);
          
        // Flow direction text
        tooltip.append("text")
          .attr("x", 0)
          .attr("y", -25)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .text(`${d.source.id.toUpperCase()} → ${d.target.id.toUpperCase()}`);
        
        // Flow value text
        tooltip.append("text")
          .attr("x", 0)
          .attr("y", -5)
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .text(`Volume: $${formatValue(d.value)}`);
        
        // Change percentage text
        tooltip.append("text")
          .attr("x", 0)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .attr("fill", d.percentage > 0 ? "#4ade80" : "#f43f5e")
          .text(`Change: ${(d.percentage >= 0 ? "+" : "") + d.percentage.toFixed(2)}%`);
      })
      .on("mouseout", function() {
        // Restore original link style
        d3.select(this)
          .attr("opacity", selectedNodeId && (d.source.id !== selectedNodeId && d.target.id !== selectedNodeId) ? 0.2 : 0.7)
          .attr("stroke-width", d => {
            const baseWidth = 1 + Math.min(8, Math.abs(d.value));
            return selectedNodeId && (d.source.id === selectedNodeId || d.target.id === selectedNodeId) ? baseWidth * 1.5 : baseWidth;
          })
          .attr("filter", null);
          
        // Remove tooltip
        svg.selectAll(".tooltip").remove();
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
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
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
      // Skip animation for faded links if a node is selected
      if (selectedNodeId && link.source.id !== selectedNodeId && link.target.id !== selectedNodeId) {
        return;
      }
      
      // Number of particles based on flow value - more particles for larger flows
      const numParticles = Math.min(6, Math.max(2, Math.floor(Math.abs(link.value))));
      const particleGroup = linkGroup.append("g").attr("class", "particles");
      
      for (let j = 0; j < numParticles; j++) {
        particleGroup.append("circle")
          .attr("class", "particle")
          .attr("r", 2)
          .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
          .attr("opacity", 0.8);
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

// Helper function to format large values
function formatValue(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(1);
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
