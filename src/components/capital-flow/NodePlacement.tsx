
import React, { useEffect } from 'react';

export type OrbitalNode = {
  id: string;
  marketCap: number;
  radius: number;
  type: "central" | "orbital";
  x: number;
  y: number;
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
  
  // Position other nodes in orbits based on market cap
  // with improved anti-collision logic
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 3 } // Increase padding for central node
  ];
  
  nonCentralNodes.forEach((node, i) => {
    // Determine which orbit layer this node belongs to based on market cap ratio
    const marketCapRatio = node.marketCap / centralNode.marketCap;
    const layerIndex = Math.min(
      orbitLayers - 1, 
      Math.floor((1 - Math.min(marketCapRatio, 0.8)) * orbitLayers)
    );
    
    // Calculate orbit radius with added spacing between orbits
    const orbitRadius = (layerIndex + 1) * baseRadius * 2; // Double spacing
    
    // Try to find a position that doesn't overlap with existing nodes
    let angle = (i * 0.618033988749895) * Math.PI * 2; // Golden angle for better distribution
    let found = false;
    let attempts = 0;
    const maxAttempts = 250; // Increase max attempts
    
    // Calculate optimal angular spacing for this orbit
    const nodesInThisOrbit = nonCentralNodes.filter(n => {
      const nodeRatio = n.marketCap / centralNode.marketCap;
      const nodeLayer = Math.min(
        orbitLayers - 1, 
        Math.floor((1 - Math.min(nodeRatio, 0.8)) * orbitLayers)
      );
      return nodeLayer === layerIndex;
    }).length;
    
    const optimalAngleStep = (2 * Math.PI) / Math.max(1, nodesInThisOrbit);
    
    while (!found && attempts < maxAttempts) {
      // Use a combination of golden angle and optimal spacing based on attempt number
      if (attempts < 30) {
        angle = (i * optimalAngleStep) + (attempts * 0.3); // Increased angle step
      } else if (attempts < 100) {
        angle = (i * 0.618033988749895 * Math.PI * 2) + (attempts * 0.1); // Try golden ratio with different offsets
      } else {
        angle = Math.random() * 2 * Math.PI; // After initial attempts, try random placement
      }
      
      const testX = width / 2 + Math.cos(angle) * orbitRadius;
      const testY = height / 2 + Math.sin(angle) * orbitRadius;
      
      // Check for collisions with existing nodes with increased safety margins
      let collision = false;
      for (const placed of placedNodes) {
        const dx = testX - placed.x;
        const dy = testY - placed.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = placed.radius + node.radius * 3; // Triple the minimum distance
        
        if (distance < minDistance) {
          collision = true;
          break;
        }
      }
      
      if (!collision) {
        node.x = testX;
        node.y = testY;
        placedNodes.push({ x: testX, y: testY, radius: node.radius * 2.5 });
        found = true;
      } else {
        attempts++;
      }
    }
    
    // If we couldn't find a non-colliding position, use a fallback method
    // Place it at a safe distance, even if not exactly on the ideal orbit
    if (!found) {
      const fallbackAngle = i * (Math.PI * 2 / nonCentralNodes.length);
      let safeRadius = orbitRadius;
      let safeX, safeY;
      
      // Find a safe radius by incrementally increasing it
      let safeFound = false;
      while (!safeFound && safeRadius < Math.min(width, height)) {
        safeX = width / 2 + Math.cos(fallbackAngle) * safeRadius;
        safeY = height / 2 + Math.sin(fallbackAngle) * safeRadius;
        
        // Check for collisions
        safeFound = true;
        for (const placed of placedNodes) {
          const dx = safeX - placed.x;
          const dy = safeY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 3; // Triple minimum distance for fallback
          
          if (distance < minDistance) {
            safeFound = false;
            break;
          }
        }
        
        if (!safeFound) {
          safeRadius += 25; // Increment by larger amount to find space faster
        }
      }
      
      node.x = safeX || width / 2 + Math.cos(fallbackAngle) * orbitRadius;
      node.y = safeY || height / 2 + Math.sin(fallbackAngle) * orbitRadius;
      placedNodes.push({ 
        x: node.x, 
        y: node.y, 
        radius: node.radius * 3 
      });
    }
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
