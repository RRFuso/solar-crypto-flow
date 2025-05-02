
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
    let lastTimestamp = Date.now();
    
    const animateOrbits = () => {
      // Calculate time delta for smooth animation regardless of frame rate
      const now = Date.now();
      const deltaTime = (now - lastTimestamp) / 1000; // convert to seconds
      lastTimestamp = now;
      
      nonCentralNodes.forEach((node) => {
        // Calculate current angle from center
        const dx = node.x - width/2;
        const dy = node.y - height/2;
        const angle = Math.atan2(dy, dx) + rotationSpeed * (deltaTime * 60); // Normalize by framerate
        const radius = Math.sqrt(dx*dx + dy*dy);
        
        // Update position with rotation
        node.x = width/2 + Math.cos(angle) * radius;
        node.y = height/2 + Math.sin(angle) * radius;
      });
      
      // Update node positions - now handled by NodeRenderer for synchronization
      
      // Update pulse circles for central node
      svg.selectAll(".pulse-circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      // Update link positions if enabled - now handled by LinkRenderer for better synchronization
      
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
