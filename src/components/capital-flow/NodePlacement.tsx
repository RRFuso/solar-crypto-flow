
import React, { useEffect } from 'react';
import { CapitalFlowNode } from '@/types/capitalFlow';

export type OrbitalNode = CapitalFlowNode & {
  type: "central" | "orbital";
};

interface NodePlacementProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export const calculateNodePositions = (props: NodePlacementProps): OrbitalNode[] => {
  const { nodes, centralNode, width, height, orbitLayers, baseRadius } = props;
  
  // Position central node in the middle
  centralNode.x = width / 2;
  centralNode.y = height / 2;
  
  // Sort non-central nodes by market cap in descending order
  const nonCentralNodes = nodes
    .filter(n => n.id !== centralNode.id)
    .sort((a, b) => b.marketCap - a.marketCap);
  
  // **CRITICAL: Much more compact and uniform orbital distribution**
  // Add margin to keep nodes fully visible (accounting for node size + extra padding)
  const margin = 60; // Space for largest nodes plus padding
  const maxRadius = Math.min(width, height) / 2 - margin;
  const minRadius = maxRadius * 0.25; // Start closer to center
  
  // Calculate optimal nodes per orbit for uniform distribution
  const totalNodes = nonCentralNodes.length;
  const nodesPerOrbit = Math.ceil(totalNodes / orbitLayers);
  
  // Create orbit groups with uniform distribution
  const orbitGroups = new Map<number, OrbitalNode[]>();
  
  nonCentralNodes.forEach((node, index) => {
    // Determine orbit index based on position in sorted array
    const orbitIndex = Math.floor(index / nodesPerOrbit);
    const actualOrbitIndex = Math.min(orbitIndex, orbitLayers - 1);
    
    // Calculate orbit radius with uniform spacing
    const radiusStep = (maxRadius - minRadius) / (orbitLayers - 1);
    const orbitRadius = minRadius + (actualOrbitIndex * radiusStep);
    
    if (!orbitGroups.has(orbitRadius)) {
      orbitGroups.set(orbitRadius, []);
    }
    orbitGroups.get(orbitRadius)!.push(node);
  });
  
  // **ENHANCED: Position nodes within each orbit with perfect angular spacing**
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 2 }
  ];
  
  orbitGroups.forEach((nodesInOrbit, orbitRadius) => {
    const angleStep = (2 * Math.PI) / nodesInOrbit.length;
    const startAngle = (orbitRadius * 0.1) % (Math.PI * 2); // Deterministic start based on orbit
    
    nodesInOrbit.forEach((node, index) => {
      const angle = startAngle + (index * angleStep);
      
      // Direct placement with minimal collision checking for speed
      const testX = width / 2 + Math.cos(angle) * orbitRadius;
      const testY = height / 2 + Math.sin(angle) * orbitRadius;
      
      // Enhanced bounds checking with proper margins
      const safeMargin = node.radius + 20; // Ensure full node visibility with padding
      if (testX >= safeMargin && testX <= width - safeMargin && 
          testY >= safeMargin && testY <= height - safeMargin) {
        node.x = testX;
        node.y = testY;
      } else {
        // Fallback: adjust radius significantly inward to ensure visibility
        const adjustedRadius = orbitRadius * 0.8;
        const fallbackX = width / 2 + Math.cos(angle) * adjustedRadius;
        const fallbackY = height / 2 + Math.sin(angle) * adjustedRadius;
        
        // Clamp to safe bounds
        node.x = Math.max(safeMargin, Math.min(width - safeMargin, fallbackX));
        node.y = Math.max(safeMargin, Math.min(height - safeMargin, fallbackY));
      }
      
      placedNodes.push({ x: node.x, y: node.y, radius: node.radius * 2 });
    });
  });
  
  return nodes;
};

export class NodePlacement {
  constructor(props: NodePlacementProps) {
    calculateNodePositions(props);
  }
}

export const NodePlacementComponent = React.memo((props: NodePlacementProps) => {
  useEffect(() => {
    calculateNodePositions(props);
  }, [props]);
  
  return null;
});
