import React, { useEffect, useRef } from 'react';
import { OrbitalNode } from './NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

interface OrbitalAnimationProps {
  svg: SVGSVGElement;
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
      const nodeElements = svg.querySelectorAll('.node');
      nodeElements.forEach((nodeElement, index) => {
        const node = nodes[index] as OrbitalNode;
        if (node) {
          nodeElement.setAttribute('transform', `translate(${node.x || 0},${node.y || 0})`);
        }
      });
      
      // FIXED: Synchronize glow positions with nodes
      const glowElements = svg.querySelectorAll('.node-glow');
      glowElements.forEach((glowElement, index) => {
        const node = nodes[index] as OrbitalNode;
        if (node) {
          glowElement.setAttribute('cx', (node.x || 0).toString());
          glowElement.setAttribute('cy', (node.y || 0).toString());
        }
      });
        
      // FIXED: Synchronize pulse circles for central node
      const pulseElements = svg.querySelectorAll('.pulse-circle');
      pulseElements.forEach((pulseElement, index) => {
        const node = nodes[index] as OrbitalNode;
        if (node) {
          pulseElement.setAttribute('cx', (node.x || 0).toString());
          pulseElement.setAttribute('cy', (node.y || 0).toString());
        }
      });
      
      // CRITICAL FIX: Synchronize signal rings with their parent nodes
      const signalRings = svg.querySelectorAll('.signal-ring');
      signalRings.forEach((ring) => {
        const nodeId = ring.getAttribute('data-node-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          ring.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
        }
      });
      
      // CRITICAL FIX: Synchronize flow indicators with nodes
      const flowIndicators = svg.querySelectorAll('.flow-indicator');
      flowIndicators.forEach((indicator) => {
        const nodeId = indicator.getAttribute('data-node-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          indicator.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
        }
      });
      
      // SYNCHRONIZED: Update link positions in real-time if enabled
      if (updateLinksInRealTime) {
        const links = svg.querySelectorAll("path.link-path, path.flow-link");
        links.forEach((linkElement) => {
          const sourceId = linkElement.getAttribute('data-source-id');
          const targetId = linkElement.getAttribute('data-target-id');
          
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceNode && targetNode) {
            const sourceX = sourceNode.x || 0;
            const sourceY = sourceNode.y || 0;
            const targetX = targetNode.x || 0;
            const targetY = targetNode.y || 0;
            
            // Calculate curved path that follows node movement
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Reduced curve for better visual clarity
            
            linkElement.setAttribute('d', `M${sourceX},${sourceY} A${dr},${dr} 0 0,1 ${targetX},${targetY}`);
          }
        });
        
        // SYNCHRONIZED: Update link gradients to follow node positions
        const gradients = svg.querySelectorAll("linearGradient");
        gradients.forEach((gradient) => {
          const sourceId = gradient.getAttribute('data-source-id');
          const targetId = gradient.getAttribute('data-target-id');
          
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceNode && targetNode) {
            gradient.setAttribute('x1', (sourceNode.x || 0).toString());
            gradient.setAttribute('y1', (sourceNode.y || 0).toString());
            gradient.setAttribute('x2', (targetNode.x || 0).toString());
            gradient.setAttribute('y2', (targetNode.y || 0).toString());
          }
        });
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
      const nodeElements = svg.querySelectorAll('.node-group, .node');
      nodeElements.forEach((nodeElement) => {
        const nodeId = nodeElement.getAttribute('data-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          // Update main node position
          nodeElement.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
        }
      });
      
      // CRITICAL FIX: Synchronize signal rings with exact node position
      const signalRings = svg.querySelectorAll('.signal-ring');
      signalRings.forEach((ring) => {
        const nodeId = ring.getAttribute('data-node-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          // Keep ring perfectly centered on node with synchronized rotation
          const ringRotation = deltaTime * 0.0003;
          ring.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0}) rotate(${ringRotation * 180 / Math.PI})`);
          
          // Update ring colors with synchronized pulsing
          if (node.divergenceBullish) {
            ring.setAttribute('stroke', '#00ff88');
            ring.setAttribute('stroke-opacity', (0.7 + Math.sin(deltaTime * 0.002) * 0.2).toString());
          } else if (node.divergenceBearish) {
            ring.setAttribute('stroke', '#ff3366');
            ring.setAttribute('stroke-opacity', (0.7 + Math.sin(deltaTime * 0.002) * 0.2).toString());
          }
        }
      });
      
      // SYNCHRONIZED: Update flow indicators
      const flowIndicators = svg.querySelectorAll('.flow-indicator');
      flowIndicators.forEach((indicator) => {
        const nodeId = indicator.getAttribute('data-node-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          // Synchronize flow indicator animations with node movement
          indicator.setAttribute('transform', `translate(${node.x || 0}, ${node.y || 0})`);
          
          if (node.inflow && node.inflow > (node.outflow || 0)) {
            indicator.setAttribute('fill', '#00ff88');
            indicator.setAttribute('opacity', (0.5 + Math.sin(deltaTime * 0.003) * 0.2).toString());
          } else if (node.outflow && node.outflow > (node.inflow || 0)) {
            indicator.setAttribute('fill', '#ff3366');
            indicator.setAttribute('opacity', (0.5 + Math.sin(deltaTime * 0.003) * 0.2).toString());
          }
        }
      });

      // SYNCHRONIZED: Update links in real-time with node movement
      if (updateLinksInRealTime) {
        const linkElements = svg.querySelectorAll('.flow-link, .link-path');
        linkElements.forEach((linkElement) => {
          const sourceId = linkElement.getAttribute('data-source-id');
          const targetId = linkElement.getAttribute('data-target-id');
          
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceNode && targetNode) {
            // Create smooth curved path that follows node movement
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
            const path = `M${sourceNode.x},${sourceNode.y} A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`;
            linkElement.setAttribute('d', path);
            
            // Update any associated gradient
            const gradientId = linkElement.getAttribute('data-gradient-id');
            if (gradientId) {
              const gradient = svg.querySelector(`#${gradientId}`);
              if (gradient) {
                gradient.setAttribute('x1', sourceNode.x.toString());
                gradient.setAttribute('y1', sourceNode.y.toString());
                gradient.setAttribute('x2', targetNode.x.toString());
                gradient.setAttribute('y2', targetNode.y.toString());
              }
            }
          }
        });
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
