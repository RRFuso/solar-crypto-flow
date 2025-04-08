
import React from 'react';
import * as d3 from 'd3';

interface LinkPathsProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  links: any[];
}

export const createLinkPaths = (props: LinkPathsProps) => {
  const { svg, links } = props;

  // Add global glow filter
  svg.append("defs")
    .append("filter")
    .attr("id", "glow")
    .append("feGaussianBlur")
    .attr("stdDeviation", "3.5")
    .attr("result", "coloredBlur");
  
  // Create unique marker for each link
  links.forEach((link, i) => {
    const markerId = `arrow-${i}`;
    const color = link.percentage > 0 ? "#4ade80" : "#f43f5e";
    
    svg.append("defs")
      .append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", color)
      .attr("d", "M0,-5L10,0L0,5");
  });

  // Draw links with enhanced visibility
  const link = svg.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("stroke", d => d.percentage > 0 ? "#4ade80" : "#f43f5e")
    .attr("stroke-width", d => 2 + Math.min(8, Math.abs(d.value) / 6)) // Adjusted thickness
    .attr("fill", "none")
    .attr("stroke-dasharray", "6,4") // More visible dash pattern
    .attr("opacity", 0.8) // Higher opacity for better visibility
    .attr("marker-end", (d, i) => `url(#arrow-${i})`)
    .attr("filter", "url(#glow)"); // Apply glow to all links
  
  // Add subtle animation to links
  link.each(function(d, i) {
    const path = d3.select(this);
    
    // Create animated particles along path
    addParticleAnimation(svg, path.node(), d);
    
    // Animate dash offset for flowing effect
    path.append("animate")
      .attr("attributeName", "stroke-dashoffset")
      .attr("values", d.percentage > 0 ? "0;-20" : "0;20") // Direction based on flow
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");
      
    // Subtle opacity pulsing
    path.append("animate")
      .attr("attributeName", "opacity")
      .attr("values", "0.8;0.6;0.8")
      .attr("dur", "3s")
      .attr("repeatCount", "indefinite");
  });

  return link;
};

// Function to add particle animation along paths
function addParticleAnimation(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, 
                             pathNode: SVGPathElement | null, 
                             linkData: any) {
  if (!pathNode) return;
  
  const particleCount = 5 + Math.floor(Math.min(10, Math.abs(linkData.value) / 2));
  const particleGroup = svg.append("g").attr("class", "particles");
  const particles: d3.Selection<SVGCircleElement, number, null, undefined>[] = [];

  // Create particles
  for (let i = 0; i < particleCount; i++) {
    const particle = particleGroup.append("circle")
      .attr("r", 2 + Math.random() * 2)
      .attr("fill", linkData.percentage > 0 ? "#4ade80" : "#f43f5e")
      .attr("opacity", 0.6 + Math.random() * 0.4)
      .attr("filter", "blur(1px)");
    
    particles.push(particle);
  }
  
  // Function to animate particles along the path
  function animateParticles() {
    const pathLength = pathNode.getTotalLength();
    
    particles.forEach((particle, i) => {
      // Calculate position based on time and index
      let position = ((Date.now() / 2000) + (i / particleCount)) % 1;
      
      // Reverse direction for negative flows
      if (linkData.percentage <= 0) {
        position = 1 - position;
      }
      
      // Get point at the path
      const point = pathNode.getPointAtLength(position * pathLength);
      particle.attr("cx", point.x)
             .attr("cy", point.y);
    });
    
    requestAnimationFrame(animateParticles);
  }
  
  // Start animation
  animateParticles();
}

// Update link paths based on node positions with enhanced curves
export const updateLinkPaths = (link: d3.Selection<SVGPathElement, any, SVGGElement, unknown>) => {
  link.attr("d", (d: any) => {
    const sourceX = d.source.x || 0;
    const sourceY = d.source.y || 0;
    const targetX = d.target.x || 0;
    const targetY = d.target.y || 0;
    
    // Calculate distance for better curve adjustment
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // More pronounced curve for visual appeal
    const curveFactor = Math.min(distance / 2.5, 100); // Increased curve factor
    
    // Calculate perpendicular offset for curve
    const normX = -dy / distance;
    const normY = dx / distance;
    
    const curveX = (sourceX + targetX) / 2 + normX * curveFactor;
    const curveY = (sourceY + targetY) / 2 + normY * curveFactor;
    
    return `M${sourceX},${sourceY} Q${curveX},${curveY} ${targetX},${targetY}`;
  });
};
