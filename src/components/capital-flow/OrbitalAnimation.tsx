
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type OrbitalNode = {
  id: string;
  marketCap: number;
  radius: number;
  type: "central" | "orbital";
  x: number;
  y: number;
};

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
}

export class OrbitalAnimation {
  private animationRef: number | undefined;
  
  constructor(props: OrbitalAnimationProps) {
    this.startAnimation(props);
  }
  
  private startAnimation({ svg, nodes, width, height }: OrbitalAnimationProps) {
    // Add subtle orbital rotation (slow for realism)
    const rotationSpeed = 0.00005; // Very slow rotation
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
      
      // Update link positions
      svg.selectAll("path")
        .attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
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
    }
  }
}

export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = (props) => {
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
};
