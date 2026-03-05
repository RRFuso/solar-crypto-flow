
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
  
  // Posicionamento inicial por órbita
  orbitGroups.forEach((nodesInOrbit, orbitRadius) => {
    const angleStep = (2 * Math.PI) / nodesInOrbit.length;
    const startAngle = (orbitRadius * 0.1) % (Math.PI * 2);

    nodesInOrbit.forEach((node, index) => {
      const angle = startAngle + (index * angleStep);
      const testX = width / 2 + Math.cos(angle) * orbitRadius;
      const testY = height / 2 + Math.sin(angle) * orbitRadius;

      const safeMargin = node.radius + 20;
      if (testX >= safeMargin && testX <= width - safeMargin && testY >= safeMargin && testY <= height - safeMargin) {
        node.x = testX;
        node.y = testY;
      } else {
        const adjustedRadius = orbitRadius * 0.8;
        const fallbackX = width / 2 + Math.cos(angle) * adjustedRadius;
        const fallbackY = height / 2 + Math.sin(angle) * adjustedRadius;
        node.x = Math.max(safeMargin, Math.min(width - safeMargin, fallbackX));
        node.y = Math.max(safeMargin, Math.min(height - safeMargin, fallbackY));
      }
    });
  });

  // Passagem extra de anti-colisão (determinística) para reduzir sobreposição após resize
  const allNodes = [centralNode, ...nonCentralNodes];
  const iterations = 24;

  for (let iteration = 0; iteration < iterations; iteration++) {
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i];
        const nodeB = allNodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minDistance = nodeA.radius + nodeB.radius + 14;

        if (distance < minDistance) {
          const overlap = (minDistance - distance) * 0.5;
          const nx = dx / distance;
          const ny = dy / distance;

          const moveA = nodeA.id === centralNode.id ? 0 : overlap;
          const moveB = nodeB.id === centralNode.id ? 0 : overlap;

          nodeA.x -= nx * moveA;
          nodeA.y -= ny * moveA;
          nodeB.x += nx * moveB;
          nodeB.y += ny * moveB;
        }
      }
    }

    nonCentralNodes.forEach((node) => {
      const safeMargin = node.radius + 16;
      node.x = Math.max(safeMargin, Math.min(width - safeMargin, node.x));
      node.y = Math.max(safeMargin, Math.min(height - safeMargin, node.y));
    });
  }

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
