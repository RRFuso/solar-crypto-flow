export interface OrbitalNode {
  id: string;
  name?: string;
  symbol: string; // Add symbol property
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

// Hash function for consistent positioning based on symbol
function hashSymbol(symbol: string | undefined): number {
  if (!symbol || typeof symbol !== 'string') {
    return Math.random(); // Fallback to random for undefined symbols
  }
  
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    const char = symbol.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483648; // Normalize to 0-1
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
    // **CRITICAL FIX: Further compressed outer orbits with non-linear scaling**
    const orbitRadius = baseRadius * Math.pow(tier + 1, 0.75) * 1.1;
    
    tierNodes.forEach((node, nodeIndex) => {
      const nodesInTier = tierNodes.length;
      const baseAngle = (nodeIndex / nodesInTier) * 2 * Math.PI;
      
      // Usar hash do símbolo para posicionamento consistente ao invés de random
      const symbolHash = hashSymbol(node.symbol);
      const angleOffset = (symbolHash - 0.5) * (Math.PI / Math.max(8, nodesInTier));
      let angle = baseAngle + angleOffset;
      
      let attempts = 0;
      let found = false;
      const maxAttempts = 40;
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          // **Tighter collision for denser packing**
          const minDistance = placed.radius + node.radius * 1.8;
          
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
          angle += Math.PI / (nodesInTier * 2.5);
          attempts++;
        }
      }
      
      if (!found) {
        // **Reduced fallback radius to keep nodes from flying off**
        const fallbackRadius = orbitRadius + (attempts * 5);
        const fallbackAngle = baseAngle + (hashSymbol(node.symbol) * Math.PI / 3);
        
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

export { hashSymbol };
