
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

  // MAJOR SCALE REDUCTION: Use much smaller multipliers for compact visualization
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 1.5 } // Reduced from 2
  ];
  
  // Group nodes by market cap tiers for better orbit distribution with compact scale
  const marketCapTiers = orbitalNodes.reduce((tiers, node, index) => {
    const tierIndex = Math.floor(index / Math.max(1, Math.floor(orbitalNodes.length / orbitLayers)));
    const clampedTier = Math.min(tierIndex, orbitLayers - 1);
    if (!tiers[clampedTier]) tiers[clampedTier] = [];
    tiers[clampedTier].push(node);
    return tiers;
  }, {} as Record<number, OrbitalNode[]>);

  Object.entries(marketCapTiers).forEach(([tierStr, tierNodes]) => {
    const tier = parseInt(tierStr);
    // COMPACT SCALE: Further reduced orbit spacing from 1.8x to 1.3x for much smaller visualization
    const orbitRadius = baseRadius * (tier + 1) * 1.3;
    
    tierNodes.forEach((node, nodeIndex) => {
      const nodesInTier = tierNodes.length;
      const baseAngle = (nodeIndex / nodesInTier) * 2 * Math.PI;
      
      // Reduced angle offset for compact spacing
      const angleOffset = (Math.random() - 0.5) * (Math.PI / Math.max(8, nodesInTier));
      let angle = baseAngle + angleOffset;
      
      let attempts = 0;
      let found = false;
      const maxAttempts = 40; // Reduced attempts for performance
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        // Tighter collision detection for compact layout
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 2.0; // Reduced from 2.5
          
          if (distance < minDistance) {
            collision = true;
            break;
          }
        }
        
        if (!collision) {
          node.x = testX;
          node.y = testY;
          placedNodes.push({ x: testX, y: testY, radius: node.radius * 1.8 });
          found = true;
        } else {
          angle += Math.PI / (nodesInTier * 2);
          attempts++;
        }
      }
      
      // Compact fallback positioning
      if (!found) {
        const fallbackRadius = orbitRadius + (attempts * 10); // Reduced from 15
        const fallbackAngle = baseAngle + (Math.random() * Math.PI / 3);
        
        node.x = width / 2 + Math.cos(fallbackAngle) * fallbackRadius;
        node.y = height / 2 + Math.sin(fallbackAngle) * fallbackRadius;
        placedNodes.push({ 
          x: node.x, 
          y: node.y, 
          radius: node.radius * 1.8 
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
