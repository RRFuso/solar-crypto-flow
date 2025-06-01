import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

// ... keep existing code (types and interfaces)

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
  
  private startAnimation({ svg, nodes, width, height, rotationSpeed = 0.00006, updateLinksInRealTime = true }: OrbitalAnimationProps) {
    // PERFECT SYNCHRONIZATION: All visual elements move together as cohesive units
    const nonCentralNodes = nodes.filter(node => node.type !== "central");
    const centralNode = nodes.find(node => node.type === "central");
    
    if (!centralNode || nonCentralNodes.length === 0) return;
    
    const animateOrbits = () => {
      // SYNCHRONIZED MOVEMENT: Move all orbital nodes together
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
      
      // CRITICAL: Update ALL visual elements in perfect synchronization
      // Update main node groups
      svg.selectAll(".node")
        .attr("transform", d => `translate(${d.x},${d.y})`);
      
      // SYNCHRONIZED: Update node glow/aura backgrounds to follow nodes exactly
      svg.selectAll(".node-glow")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
        
      // SYNCHRONIZED: Update central pulse circles
      svg.selectAll(".pulse-circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      // CRITICAL SYNCHRONIZATION: Signal rings must follow their parent nodes exactly
      svg.selectAll(".signal-ring")
        .attr("transform", d => {
          // Signal rings move with their parent node and maintain relative rotation
          const nodeRotation = Math.atan2(d.y - height/2, d.x - width/2) * 180 / Math.PI;
          return `translate(${d.x || 0}, ${d.y || 0}) rotate(${nodeRotation})`;
        });
      
      // SYNCHRONIZED: Flow indicators follow nodes exactly
      svg.selectAll(".flow-indicator")
        .attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
      
      // SYNCHRONIZED: Update background glow effects
      svg.selectAll(".node-background")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      // SYNCHRONIZED: Update all node-related visual elements
      svg.selectAll(".nodes-group .node")
        .each(function(d) {
          const nodeGroup = d3.select(this);
          
          // Update any child elements that need positioning
          nodeGroup.selectAll("circle:not(.node-circle)")
            .attr("cx", 0) // Relative to parent group
            .attr("cy", 0);
          
          nodeGroup.selectAll("text")
            .attr("x", 0)
            .attr("y", d => (d.radius || 20) + 15);
        });
      
      // SYNCHRONIZED: Update link positions in real-time with node movement
      if (updateLinksInRealTime) {
        const links = svg.selectAll("path.link-path, path.flow-link");
        if (!links.empty()) {
          links.attr("d", d => {
            if (!d || !d.source || !d.target) return "";
            
            const sourceX = d.source.x || 0;
            const sourceY = d.source.y || 0;
            const targetX = d.target.x || 0;
            const targetY = d.target.y || 0;
            
            // Create smooth curved path that follows node movement perfectly
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.1; // Smooth curve
            
            return `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
          });
          
          // SYNCHRONIZED: Update link gradients to follow node positions exactly
          svg.selectAll("linearGradient")
            .each(function(d: any) {
              if (!d || !d.source || !d.target) return;
              
              d3.select(this)
                .attr("x1", d.source.x || 0)
                .attr("y1", d.source.y || 0)
                .attr("x2", d.target.x || 0)
                .attr("y2", d.target.y || 0);
            });
        }
      }
      
      // Continue synchronized animation
      this.animationRef = requestAnimationFrame(animateOrbits);
    };
    
    // Start perfectly synchronized animation
    this.animationRef = requestAnimationFrame(animateOrbits);
  }
  
  public cleanup() {
    if (this.animationRef) {
      cancelAnimationFrame(this.animationRef);
      this.animationRef = undefined;
    }
  }
}

// ENHANCED COMPONENT: Perfect synchronization of all visual elements
export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  svg,
  nodes,
  width,
  height,
  rotationSpeed = 0.00006, // Slightly reduced for smoother animation
  updateLinksInRealTime = true
}) => {
  useEffect(() => {
    if (!svg || nodes.length === 0) return;

    const centralNode = nodes.find(node => node.type === "central");
    const orbitalNodes = nodes.filter(node => node.type === "orbital");
    
    if (!centralNode) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - startTime) * rotationSpeed;

      // PERFECTLY SYNCHRONIZED: Enhanced orbital movement with all visual elements
      orbitalNodes.forEach((node, index) => {
        if (!node.x || !node.y) return;

        // Calculate current orbital radius and angle
        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        
        // Market cap based speed (larger caps move slower)
        const marketCapFactor = Math.max(0.3, Math.min(1.2, Math.log10(node.marketCap || 1) / 8));
        const speed = rotationSpeed / (marketCapFactor * 0.7);
        
        const currentAngle = Math.atan2(dy, dx);
        const newAngle = currentAngle + speed;
        
        // Update node position
        node.x = width / 2 + Math.cos(newAngle) * currentRadius;
        node.y = height / 2 + Math.sin(newAngle) * currentRadius;
      });

      // PERFECTLY SYNCHRONIZED: Update ALL visual elements together as cohesive units
      const nodeElements = svg.selectAll('.node-group, .node').data(nodes, (d: any) => d.id);
      
      nodeElements.each(function(d) {
        const nodeGroup = d3.select(this);
        
        // Update main node position
        nodeGroup.attr('transform', `translate(${d.x || 0}, ${d.y || 0})`);
        
        // CRITICAL: Signal rings follow nodes with perfect synchronization
        const signalRings = svg.selectAll(`.signal-ring[data-node-id="${d.id}"]`);
        if (!signalRings.empty()) {
          signalRings.each(function() {
            const ring = d3.select(this);
            
            // Perfect synchronization: ring follows node position exactly
            const nodeRotation = Math.atan2(d.y - height/2, d.x - width/2) * 180 / Math.PI;
            ring.attr('transform', `translate(${d.x}, ${d.y}) rotate(${nodeRotation + deltaTime * 0.0002})`);
            
            // Synchronized color pulsing
            if (d.divergenceBullish) {
              ring.attr('stroke', '#00ff88').attr('stroke-opacity', 0.7 + Math.sin(deltaTime * 0.002) * 0.2);
            } else if (d.divergenceBearish) {
              ring.attr('stroke', '#ff3366').attr('stroke-opacity', 0.7 + Math.sin(deltaTime * 0.002) * 0.2);
            }
          });
        }
        
        // SYNCHRONIZED: Flow indicators follow nodes exactly
        const flowIndicators = svg.selectAll(`.flow-indicator[data-node-id="${d.id}"]`);
        if (!flowIndicators.empty()) {
          flowIndicators.attr('transform', `translate(${d.x || 0}, ${d.y || 0})`);
        }
        
        // SYNCHRONIZED: Glow effects follow nodes exactly
        const glowEffects = svg.selectAll(`.node-glow[data-node-id="${d.id}"]`);
        if (!glowEffects.empty()) {
          glowEffects.attr('cx', d.x).attr('cy', d.y);
        }
      });

      // SYNCHRONIZED: Update links in perfect real-time sync with node movement
      if (updateLinksInRealTime) {
        const linkElements = svg.selectAll('.flow-link, .link-path');
        if (!linkElements.empty()) {
          linkElements.each(function(d: any) {
            if (d.source && d.target && d.source.x && d.target.x) {
              const link = d3.select(this);
              const dx = d.target.x - d.source.x;
              const dy = d.target.y - d.source.y;
              const dr = Math.sqrt(dx * dx + dy * dy) * 1.1;
              const path = `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
              link.attr('d', path);
            }
          });
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start the perfectly synchronized animation
    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [svg, nodes, width, height, rotationSpeed, updateLinksInRealTime]);

  return null;
};
