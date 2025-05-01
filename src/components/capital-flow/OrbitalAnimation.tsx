
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
}

export class OrbitalAnimation {
  private animationRef: number | undefined;
  
  constructor(props: OrbitalAnimationProps) {
    this.startAnimation(props);
  }
  
  private startAnimation({ svg, nodes, width, height, rotationSpeed = 0.00008 }: OrbitalAnimationProps) {
    // Add subtle orbital rotation (slow for realism)
    const nonCentralNodes = nodes.filter(node => node.type !== "central");
    
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
      
      // Update link positions - now correctly handles the links too
      svg.selectAll("path.link-path")
        .attr("d", function(d: any) {
          if (!d.source || !d.target) return "";
          
          const sourceX = d.source.x || 0;
          const sourceY = d.source.y || 0;
          const targetX = d.target.x || 0;
          const targetY = d.target.y || 0;
          
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          
          return `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
        });
        
      // Update particle positions
      svg.selectAll(".flow-particle")
        .attr("cx", function(d: any) {
          const path = d3.select(this.parentNode).select("path.link-path").node() as SVGPathElement;
          if (!path) return 0;
          
          const pathLength = path.getTotalLength();
          const position = (d.progress + d.speed) % 1;
          const point = path.getPointAtLength(position * pathLength);
          
          // Update particle data
          d.progress = position;
          
          return point.x;
        })
        .attr("cy", function(d: any) {
          const path = d3.select(this.parentNode).select("path.link-path").node() as SVGPathElement;
          if (!path) return 0;
          
          const pathLength = path.getTotalLength();
          const position = d.progress;
          const point = path.getPointAtLength(position * pathLength);
          
          return point.y;
        });
      
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
