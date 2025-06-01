
export interface OrbitalNode {
  id: string;
  name?: string;
  x: number;
  y: number;
  radius: number;
  volume?: number;
  category?: string;
  categories?: string[];
  divergenceBullish?: boolean;
  divergenceBearish?: boolean;
  inflow?: number;
  outflow?: number;
  marketCap: number;
  type: "central" | "orbital";
}

interface CalculateNodePositionsProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export const calculateNodePositions = ({
  nodes,
  centralNode,
  width,
  height,
  orbitLayers,
  baseRadius,
}: CalculateNodePositionsProps) => {
  if (!centralNode) return;

  // Place central node in the center
  centralNode.x = width / 2;
  centralNode.y = height / 2;

  // Sort non-central nodes by market cap in descending order
  const orbitalNodes = nodes
    .filter(node => node.id !== centralNode.id)
    .sort((a, b) => b.marketCap - a.marketCap);

  // Enhanced orbital positioning with better spacing
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 4 } // Increased central padding
  ];
  
  // Group nodes by market cap tiers for better orbit distribution
  const marketCapTiers = orbitalNodes.reduce((tiers, node, index) => {
    const tierIndex = Math.floor(index / Math.max(1, Math.floor(orbitalNodes.length / orbitLayers)));
    const clampedTier = Math.min(tierIndex, orbitLayers - 1);
    if (!tiers[clampedTier]) tiers[clampedTier] = [];
    tiers[clampedTier].push(node);
    return tiers;
  }, {} as Record<number, OrbitalNode[]>);

  Object.entries(marketCapTiers).forEach(([tierStr, tierNodes]) => {
    const tier = parseInt(tierStr);
    const orbitRadius = baseRadius * (tier + 1) * 3; // Tripled spacing between orbits
    
    tierNodes.forEach((node, nodeIndex) => {
      // Enhanced angular distribution within each orbit
      const nodesInTier = tierNodes.length;
      const baseAngle = (nodeIndex / nodesInTier) * 2 * Math.PI;
      
      // Add random offset to prevent perfect alignment
      const angleOffset = (Math.random() - 0.5) * (Math.PI / Math.max(4, nodesInTier));
      let angle = baseAngle + angleOffset;
      
      let attempts = 0;
      let found = false;
      const maxAttempts = 100;
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        // Enhanced collision detection with larger safety margins
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 4; // Quadrupled minimum distance
          
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
          // More aggressive angle adjustment for collision avoidance
          angle += Math.PI / (nodesInTier * 2);
          attempts++;
        }
      }
      
      // Enhanced fallback positioning
      if (!found) {
        const fallbackRadius = orbitRadius + (attempts * 20); // Progressive radius increase
        const fallbackAngle = baseAngle + (Math.random() * Math.PI / 2);
        
        node.x = width / 2 + Math.cos(fallbackAngle) * fallbackRadius;
        node.y = height / 2 + Math.sin(fallbackAngle) * fallbackRadius;
        placedNodes.push({ 
          x: node.x, 
          y: node.y, 
          radius: node.radius * 3 
        });
      }
    });
  });
  
  return nodes;
};

export class NodePlacement {
  constructor(props: CalculateNodePositionsProps) {
    calculateNodePositions(props);
  }
}
