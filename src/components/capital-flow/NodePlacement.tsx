
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
  
  // **ENHANCED: Group nodes by orbital layer first**
  const orbitGroups = new Map<number, OrbitalNode[]>();
  
  nonCentralNodes.forEach((node, i) => {
    // Determine which orbit layer this node belongs to based on market cap ratio
    const marketCapRatio = node.marketCap / centralNode.marketCap;
    const layerIndex = Math.min(
      orbitLayers - 1, 
      Math.floor((1 - Math.min(marketCapRatio, 0.8)) * orbitLayers)
    );
    
    // **OPTIMIZED: Increased spacing between orbits**
    const orbitRadius = (layerIndex + 1) * baseRadius * 3.0; // Increased from 2.5 to 3.0
    
    if (!orbitGroups.has(orbitRadius)) {
      orbitGroups.set(orbitRadius, []);
    }
    orbitGroups.get(orbitRadius)!.push(node);
  });
  
  // **ENHANCED: Position nodes within each orbit with perfect angular distribution**
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 4 } // Increased padding for central node
  ];
  
  orbitGroups.forEach((nodesInOrbit, orbitRadius) => {
    const angleStep = (2 * Math.PI) / nodesInOrbit.length;
    const startAngle = Math.random() * Math.PI * 2; // Random start angle to avoid clustering
    
    nodesInOrbit.forEach((node, index) => {
      let angle = startAngle + (index * angleStep);
      let found = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      // **ENHANCED: Try multiple angle offsets to avoid collisions**
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        // Check for collisions with existing nodes
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 4; // Increased minimum distance
          
          if (distance < minDistance) {
            collision = true;
            break;
          }
        }
        
        if (!collision) {
          node.x = testX;
          node.y = testY;
          placedNodes.push({ x: testX, y: testY, radius: node.radius * 3 });
          found = true;
        } else {
          // **ENHANCED: Smart angle adjustment**
          if (attempts < 50) {
            angle += angleStep * 0.1; // Small adjustment
          } else {
            angle += angleStep * 0.3; // Larger adjustment
          }
          attempts++;
        }
      }
      
      // **FALLBACK: If no position found, use safe radial placement**
      if (!found) {
        let safeRadius = orbitRadius;
        let safeAngle = startAngle + (index * angleStep);
        
        // Find safe radius by incrementally increasing
        for (let radiusMultiplier = 1.0; radiusMultiplier <= 2.0; radiusMultiplier += 0.1) {
          safeRadius = orbitRadius * radiusMultiplier;
          const safeX = width / 2 + Math.cos(safeAngle) * safeRadius;
          const safeY = height / 2 + Math.sin(safeAngle) * safeRadius;
          
          // Check if this position is safe
          let safePlacement = true;
          for (const placed of placedNodes) {
            const dx = safeX - placed.x;
            const dy = safeY - placed.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = placed.radius + node.radius * 4;
            
            if (distance < minDistance) {
              safePlacement = false;
              break;
            }
          }
          
          if (safePlacement) {
            node.x = safeX;
            node.y = safeY;
            placedNodes.push({ x: safeX, y: safeY, radius: node.radius * 3 });
            break;
          }
        }
      }
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
