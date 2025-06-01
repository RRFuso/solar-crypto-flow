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
    // Add orbital rotation
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
            .each(function(d: any) {
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
export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  svg,
  nodes,
  width,
  height,
  rotationSpeed = 0.00012,
  updateLinksInRealTime = true
}) => {
  useEffect(() => {
    if (!svg || nodes.length === 0) return;

    // Find central node
    const centralNode = nodes.find(node => node.type === "central");
    const orbitalNodes = nodes.filter(node => node.type === "orbital");
    
    if (!centralNode) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - startTime) * rotationSpeed;

      // Enhanced orbital movement with synchronized signal rings
      orbitalNodes.forEach((node, index) => {
        if (!node.x || !node.y) return;

        // Calculate current orbital radius and angle
        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        
        // Enhanced movement based on market cap (inverse speed - larger caps move slower)
        const marketCapFactor = Math.max(0.1, Math.min(2, Math.log10(node.marketCap || 1) / 10));
        const speed = rotationSpeed / (marketCapFactor * 0.8); // Adjusted speed calculation
        
        const currentAngle = Math.atan2(dy, dx);
        const newAngle = currentAngle + speed;
        
        // Update node position
        node.x = width / 2 + Math.cos(newAngle) * currentRadius;
        node.y = height / 2 + Math.sin(newAngle) * currentRadius;
      });

      // Enhanced node rendering with synchronized signal rings
      const nodeElements = svg.selectAll('.node-group').data(nodes, (d: any) => d.id);
      
      nodeElements.each(function(d) {
        const nodeGroup = d3.select(this);
        
        // Update main node position
        nodeGroup.attr('transform', `translate(${d.x || 0}, ${d.y || 0})`);
        
        // Update synchronized signal rings if they exist
        const signalRings = nodeGroup.selectAll('.signal-ring');
        if (!signalRings.empty()) {
          signalRings.each(function(ringData: any) {
            const ring = d3.select(this);
            
            // Synchronize ring position and rotation with parent node
            const ringRotation = deltaTime * 0.0005; // Slower ring rotation
            ring.attr('transform', `rotate(${ringRotation * 180 / Math.PI})`);
            
            // Update ring colors based on node state
            if (d.divergenceBullish) {
              ring.attr('stroke', '#00ff88').attr('stroke-opacity', 0.6 + Math.sin(deltaTime * 0.003) * 0.3);
            } else if (d.divergenceBearish) {
              ring.attr('stroke', '#ff3366').attr('stroke-opacity', 0.6 + Math.sin(deltaTime * 0.003) * 0.3);
            }
          });
        }
        
        // Update flow indicators
        const flowIndicators = nodeGroup.selectAll('.flow-indicator');
        if (!flowIndicators.empty()) {
          flowIndicators.each(function(flowData: any) {
            const indicator = d3.select(this);
            
            // Synchronize flow indicator animations
            if (d.inflow && d.inflow > (d.outflow || 0)) {
              indicator
                .attr('fill', '#00ff88')
                .attr('opacity', 0.4 + Math.sin(deltaTime * 0.004) * 0.3);
            } else if (d.outflow && d.outflow > (d.inflow || 0)) {
              indicator
                .attr('fill', '#ff3366')
                .attr('opacity', 0.4 + Math.sin(deltaTime * 0.004) * 0.3);
            }
          });
        }
      });

      // Update links in real-time if enabled
      if (updateLinksInRealTime) {
        const linkElements = svg.selectAll('.flow-link');
        if (!linkElements.empty()) {
          linkElements.each(function(d: any) {
            if (d.source && d.target && d.source.x && d.target.x) {
              const link = d3.select(this);
              const path = `M${d.source.x},${d.source.y} Q${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2 - 50} ${d.target.x},${d.target.y}`;
              link.select('path').attr('d', path);
            }
          });
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start the animation
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
