
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number; // Add configurable rotation speed
  updateLinksInRealTime?: boolean; // Add option to update links in real time
}

export class OrbitalAnimation {
  private animationRef: number | undefined;
  
  constructor(props: OrbitalAnimationProps) {
    this.startAnimation(props);
  }
  
  private startAnimation({ svg, nodes, width, height, rotationSpeed = 0.00012, updateLinksInRealTime = true }: OrbitalAnimationProps) {
    // Add orbital rotation (increased speed from 0.00008 to 0.00012)
    const nonCentralNodes = nodes.filter(node => node.type !== "central");
    const centralNode = nodes.find(node => node.type === "central");
    
    if (!centralNode || nonCentralNodes.length === 0) return;
    
    const animateOrbits = () => {
      nonCentralNodes.forEach((node) => {
        // Calculate current angle from center
        const dx = node.x - width/2;
        const dy = node.y - height/2;
        const angle = Math.atan2(dy, dx) + rotationSpeed;
        const radius = Math.sqrt(dx*dx + dy*dy);
        
        // Update position with rotation
        node.x = width/2 + Math.cos(angle) * radius;
        node.y = height/2 + Math.sin(angle) * radius;
      });
      
      // Update node positions
      svg.selectAll(".node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Update glow positions (synchronize with nodes)
      svg.selectAll(".node-glow")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
        
      // Update pulse circles for central node
      svg.selectAll(".pulse-circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      // Update link positions if enabled
      if (updateLinksInRealTime) {
        const links = svg.selectAll("path.link-path");
        if (!links.empty()) {
          links.attr("d", d => {
            if (!d || !d.source || !d.target) return "";
            
            const sourceX = d.source.x || 0;
            const sourceY = d.source.y || 0;
            const targetX = d.target.x || 0;
            const targetY = d.target.y || 0;
            
            // Calculate distance for curve
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            
            return `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
          });
          
          // Update link gradients to follow node positions
          svg.selectAll("linearGradient")
            .each(function(d) {
              if (!d || !d.source || !d.target) return;
              
              d3.select(this)
                .attr("x1", d.source.x || 0)
                .attr("y1", d.source.y || 0)
                .attr("x2", d.target.x || 0)
                .attr("y2", d.target.y || 0);
            });
          
          // Update arrowheads position
          svg.selectAll("marker")
            .attr("refX", d => {
              if (!d || !d.target) return 8;
              // Adjust refX based on target node radius
              const targetRadius = d.target.radius || 20;
              return 8 + targetRadius * 0.8;
            });
        }
      }
      
      // Continue animation
      this.animationRef = requestAnimationFrame(animateOrbits);
    };
    
    // Start animation
    this.animationRef = requestAnimationFrame(animateOrbits);
  }
  
  public cleanup() {
    if (this.animationRef) {
      cancelAnimationFrame(this.animationRef);
      this.animationRef = undefined;
    }
  }
}

// Fix component export for Fast Refresh compatibility
export const OrbitalAnimationComponent = React.memo((props: OrbitalAnimationProps) => {
  const animationInstanceRef = useRef<OrbitalAnimation | null>(null);
  
  useEffect(() => {
    animationInstanceRef.current = new OrbitalAnimation(props);
    
    // Cleanup on unmount
    return () => {
      if (animationInstanceRef.current) {
        animationInstanceRef.current.cleanup();
      }
    };
  }, [props]);
  
  return null;
});
