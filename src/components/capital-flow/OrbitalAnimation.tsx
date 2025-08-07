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
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

export class OrbitalAnimation {
  private animationRef: number | undefined;
  
  constructor(props: OrbitalAnimationProps) {
    this.startAnimation(props);
  }
  
  private startAnimation({ svg, nodes, width, height, rotationSpeed = 0.00008, updateLinksInRealTime = true }: OrbitalAnimationProps) {
    // FIXED: Synchronized animation for nodes, rings, and links
    const nonCentralNodes = nodes.filter(node => node.type !== "central");
    const centralNode = nodes.find(node => node.type === "central");
    
    if (!centralNode || nonCentralNodes.length === 0) return;
    
    const animateOrbits = () => {
      // SYNCHRONIZED: Move all orbital nodes together
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
      
      // SYNCHRONIZED: Update all visual elements together
      // Update node positions
      svg.selectAll(".node")
        .attr("transform", (d: OrbitalNode) => `translate(${d.x || 0},${d.y || 0})`);
      
      // FIXED: Synchronize glow positions with nodes
      svg.selectAll(".node-glow")
        .attr("cx", (d: OrbitalNode) => d.x || 0)
        .attr("cy", (d: OrbitalNode) => d.y || 0);
        
      // FIXED: Synchronize pulse circles for central node
      svg.selectAll(".pulse-circle")
        .attr("cx", (d: OrbitalNode) => d.x || 0)
        .attr("cy", (d: OrbitalNode) => d.y || 0);
      
      // CRITICAL FIX: Synchronize signal rings with their parent nodes
      svg.selectAll(".signal-ring")
        .attr("transform", (d: OrbitalNode) => {
          // Each signal ring should follow its parent node exactly
          return `translate(${d.x || 0}, ${d.y || 0})`;
        });
      
      // CRITICAL FIX: Synchronize flow indicators with nodes
      svg.selectAll(".flow-indicator")
        .attr("transform", (d: OrbitalNode) => `translate(${d.x || 0}, ${d.y || 0})`);
      
      // SYNCHRONIZED: Update link positions in real-time if enabled
      if (updateLinksInRealTime) {
        const links = svg.selectAll("path.link-path, path.flow-link");
        if (!links.empty()) {
          links.attr("d", (d: OrbitalLink) => {
            if (!d || !d.source || !d.target) return "";
            
            const sourceX = d.source.x || 0;
            const sourceY = d.source.y || 0;
            const targetX = d.target.x || 0;
            const targetY = d.target.y || 0;
            
            // Calculate curved path that follows node movement
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Reduced curve for better visual clarity
            
            return `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
          });
          
          // SYNCHRONIZED: Update link gradients to follow node positions
          svg.selectAll("linearGradient")
            .each(function(d: OrbitalLink) {
              if (!d || !d.source || !d.target) return;
              
              d3.select(this)
                .attr("x1", d.source.x || 0)
                .attr("y1", d.source.y || 0)
                .attr("x2", d.target.x || 0)
                .attr("y2", d.target.y || 0);
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

// FIXED: Enhanced component with synchronized animations
export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  svg,
  nodes,
  width,
  height,
  rotationSpeed = 0.00008, // Reduced for smoother animation
  updateLinksInRealTime = false
}) => {
  useEffect(() => {
    if (!svg || nodes.length === 0) return;

    // Find central node
    const centralNode = nodes.find(node => node.type === "central");
    const orbitalNodes = nodes.filter(node => node.type === "orbital");
    
    if (!centralNode) return;

    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - startTime) * rotationSpeed;

      // SYNCHRONIZED: Enhanced orbital movement with all visual elements moving together
      orbitalNodes.forEach((node, index) => {
        if (!node.x || !node.y) return;

        // Calculate current orbital radius and angle
        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        
        // Market cap based speed (larger caps move slower)
        const marketCapFactor = Math.max(0.2, Math.min(1.5, Math.log10(node.marketCap || 1) / 8));
        const speed = rotationSpeed / (marketCapFactor * 0.6);
        
        const currentAngle = Math.atan2(dy, dx);
        const newAngle = currentAngle + speed;
        
        // Update node position
        node.x = width / 2 + Math.cos(newAngle) * currentRadius;
        node.y = height / 2 + Math.sin(newAngle) * currentRadius;
      });

      // SYNCHRONIZED: Update all visual elements together
      const nodeElements = svg.selectAll('.node-group, .node').data(nodes, (d: OrbitalNode) => d.id);
      
      nodeElements.each(function(d: OrbitalNode) {
        const nodeGroup = d3.select(this);
        
        // Update main node position
        nodeGroup.attr('transform', `translate(${d.x || 0}, ${d.y || 0})`);
        
        // CRITICAL FIX: Synchronize signal rings with exact node position
        const signalRings = nodeGroup.selectAll('.signal-ring');
        if (!signalRings.empty()) {
          signalRings.each(function(ringData: OrbitalNode) {
            const ring = d3.select(this);
            
            // Keep ring perfectly centered on node with synchronized rotation
            const ringRotation = deltaTime * 0.0003;
            ring.attr('transform', `rotate(${ringRotation * 180 / Math.PI})`);
            
            // Update ring colors with synchronized pulsing
            if (d.divergenceBullish) {
              ring.attr('stroke', '#00ff88').attr('stroke-opacity', 0.7 + Math.sin(deltaTime * 0.002) * 0.2);
            } else if (d.divergenceBearish) {
              ring.attr('stroke', '#ff3366').attr('stroke-opacity', 0.7 + Math.sin(deltaTime * 0.002) * 0.2);
            }
          });
        }
        
        // SYNCHRONIZED: Update flow indicators
        const flowIndicators = nodeGroup.selectAll('.flow-indicator');
        if (!flowIndicators.empty()) {
          flowIndicators.each(function(flowData: OrbitalNode) {
            const indicator = d3.select(this);
            
            // Synchronize flow indicator animations with node movement
            if (d.inflow && d.inflow > (d.outflow || 0)) {
              indicator
                .attr('fill', '#00ff88')
                .attr('opacity', 0.5 + Math.sin(deltaTime * 0.003) * 0.2);
            } else if (d.outflow && d.outflow > (d.inflow || 0)) {
              indicator
                .attr('fill', '#ff3366')
                .attr('opacity', 0.5 + Math.sin(deltaTime * 0.003) * 0.2);
            }
          });
        }
      });

      // SYNCHRONIZED: Update links in real-time with node movement
      if (updateLinksInRealTime) {
        const linkElements = svg.selectAll('.flow-link, .link-path');
        if (!linkElements.empty()) {
          linkElements.each(function(d: OrbitalLink) {
            if (d.source && d.target && d.source.x && d.target.x) {
              const link = d3.select(this);
              // Create smooth curved path that follows node movement
              const dx = d.target.x - d.source.x;
              const dy = d.target.y - d.source.y;
              const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
              const path = `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
              link.select('path').attr('d', path);
            }
          });
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start the synchronized animation
    animate();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [svg, nodes, width, height, rotationSpeed, updateLinksInRealTime]);

  return null;
};
