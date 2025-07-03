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

  // **CRITICAL FIX: Dramatically reduced scale for perfect viewport fit**
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 1.5 } // Reduced from 2 to 1.5
  ];
  
  // **Group nodes by market cap tiers with much smaller scale**
  const marketCapTiers = orbitalNodes.reduce((tiers, node, index) => {
    const tierIndex = Math.floor(index / Math.max(1, Math.floor(orbitalNodes.length / orbitLayers)));
    const clampedTier = Math.min(tierIndex, orbitLayers - 1);
    if (!tiers[clampedTier]) tiers[clampedTier] = [];
    tiers[clampedTier].push(node);
    return tiers;
  }, {} as Record<number, OrbitalNode[]>);

  Object.entries(marketCapTiers).forEach(([tierStr, tierNodes]) => {
    const tier = parseInt(tierStr);
    // **CRITICAL FIX: Reduced orbit spacing from 1.8x to 1.2x for much tighter orbits**
    const orbitRadius = baseRadius * (tier + 1) * 1.2;
    
    tierNodes.forEach((node, nodeIndex) => {
      const nodesInTier = tierNodes.length;
      const baseAngle = (nodeIndex / nodesInTier) * 2 * Math.PI;
      
      // **Reduced angle offset for better spacing in smaller scale**
      const angleOffset = (Math.random() - 0.5) * (Math.PI / Math.max(8, nodesInTier)); // Increased denominator
      let angle = baseAngle + angleOffset;
      
      let attempts = 0;
      let found = false;
      const maxAttempts = 40; // Reduced attempts for faster placement
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        // **Reduced collision detection margins for tighter but clear spacing**
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 2.0; // Reduced from 2.5 to 2.0
          
          if (distance < minDistance) {
            collision = true;
            break;
          }
        }
        
        if (!collision) {
          node.x = testX;
          node.y = testY;
          placedNodes.push({ x: testX, y: testY, radius: node.radius * 1.8 }); // Reduced from 2 to 1.8
          found = true;
        } else {
          angle += Math.PI / (nodesInTier * 2.5); // Increased denominator for smaller angle steps
          attempts++;
        }
      }
      
      // **Fallback positioning with smaller increments**
      if (!found) {
        const fallbackRadius = orbitRadius + (attempts * 10); // Reduced from 15 to 10
        const fallbackAngle = baseAngle + (Math.random() * Math.PI / 3); // Reduced angle range
        
        node.x = width / 2 + Math.cos(fallbackAngle) * fallbackRadius;
        node.y = height / 2 + Math.sin(fallbackAngle) * fallbackRadius;
        placedNodes.push({ 
          x: node.x, 
          y: node.y, 
          radius: node.radius * 1.8 // Consistent with above
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
