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
    // Elliptical orbits: full width, constrained height
    const maxRx = width / 2 - 60;
    const maxRy = height / 2 - 60;
    const rawRx = baseRadius * Math.pow(tier + 1, 0.75) * 0.9 * (width / Math.min(width, height));
    const rawRy = baseRadius * Math.pow(tier + 1, 0.75) * 0.9;
    const orbitRx = Math.min(rawRx, maxRx);
    const orbitRy = Math.min(rawRy, maxRy);
    
    tierNodes.forEach((node, nodeIndex) => {
      const nodesInTier = tierNodes.length;
      const baseAngle = (nodeIndex / nodesInTier) * 2 * Math.PI;
      
      const symbolHash = hashSymbol(node.symbol);
      const angleOffset = (symbolHash - 0.5) * (Math.PI / Math.max(8, nodesInTier));
      let angle = baseAngle + angleOffset;
      
      let attempts = 0;
      let found = false;
      const maxAttempts = 40;
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRx;
        const testY = height / 2 + Math.sin(angle) * orbitRy;
        
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
        const fallbackAngle = baseAngle + (hashSymbol(node.symbol) * Math.PI / 3);
        const rawX = width / 2 + Math.cos(fallbackAngle) * orbitRx;
        const rawY = height / 2 + Math.sin(fallbackAngle) * orbitRy;
        const margin = node.radius + 30;
        node.x = Math.max(margin, Math.min(width - margin, rawX));
        node.y = Math.max(margin, Math.min(height - margin, rawY));
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
