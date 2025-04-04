import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

interface LinkRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: OrbitalLink[];
}

export class LinkRenderer {
  constructor(props: LinkRendererProps) {
    this.renderLinks(props);
  }
  
  private renderLinks({ svg, links }: LinkRendererProps) {
    // Clear any existing links first
    svg.selectAll('.links-group').remove();
    
    // Draw links with gradient
    const linkGroup = svg.append("g")
      .attr("class", "links-group");
    
    // Create gradients for links
    const defs = svg.append("defs");
    
    links.forEach((link, i) => {
      const id = `link-gradient-${i}`;
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x)
        .attr("y1", link.source.y)
        .attr("x2", link.target.x)
        .attr("y2", link.target.y);
        
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#F7931A");
        
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#00b5d8");
      
      // Create arrow markers
      defs.append("marker")
        .attr("id", `arrow-${i}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", link.target.radius + 10) // Adjust to stop at node edge
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e");
    });
    
    // Draw link paths
    linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link-path")
      .attr("d", d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      })
      .attr("stroke", (d, i) => `url(#link-gradient-${i})`)
      .attr("stroke-width", d => 2 + Math.min(5, Math.abs(d.value) / 10) * 2)
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10")
      .attr("opacity", 0.7)
      .attr("marker-end", (d, i) => `url(#arrow-${i})`);
      
    // Add flow particles animation
    links.forEach((link, i) => {
      const particleGroup = svg.append("g")
        .attr("class", "flow-particles");
        
      const particles = particleGroup
        .selectAll("circle")
        .data(d3.range(5)) // 5 particles per link
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
        .attr("opacity", 0.8);
      
      function animateParticles() {
        const path = linkGroup.selectAll("path").nodes()[i];
        if (!path) return;
        
        const pathLength = path.getTotalLength();
        
        particles.attr("transform", function(d, j) {
          // Stagger the particles
          let offset = (j / 5) * pathLength;
          
          // Add time-based offset that loops
          offset += (Date.now() / 50) % pathLength;
          
          // Reverse direction for outflows
          if (link.percentage <= 0) {
            offset = pathLength - offset;
          }
          
          // Loop back to start when reaching the end
          offset = offset % pathLength;
          
          // Get point along the path
          const point = path.getPointAtLength(offset);
          return `translate(${point.x}, ${point.y})`;
        });
      }
      
      // Start animation for the particles - this is handled by the orbital animation class
    });
  }
}

// Fix component export for Fast Refresh compatibility
export const LinkRendererComponent = React.memo(({ svg, links }: LinkRendererProps) => {
  useEffect(() => {
    new LinkRenderer({ svg, links });
    
    // Clean up
    return () => {
      svg.selectAll(".flow-particles").remove();
    };
  }, [svg, links]);
  
  return null;
});
