
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';
import { calculateOrbitalPath } from './link-renderer/LinkStyling';

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
      
      // Update glow positions
      svg.selectAll(".node-glow")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      // Update link paths dynamically
      svg.selectAll("path.link")
        .attr("d", calculateOrbitalPath);
      
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
