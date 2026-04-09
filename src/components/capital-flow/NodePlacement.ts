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

  if (orbitalNodes.length === 0) return nodes;

  // Safe margins — account for node radius + label text below
  const safeMarginX = 70;
  const safeMarginY = 70;
  const maxRx = width / 2 - safeMarginX;
  const maxRy = height / 2 - safeMarginY;

  // Minimum collision distance includes visual footprint (logo + label + badge)
  const getCollisionRadius = (node: OrbitalNode): number => {
    return Math.max(node.radius * 2.2, 28);
  };

  const placedNodes: Array<{ x: number; y: number; collisionR: number }> = [
    { x: centralNode.x, y: centralNode.y, collisionR: getCollisionRadius(centralNode) * 1.5 },
  ];

  // Distribute nodes into orbit tiers
  const effectiveLayers = Math.max(2, Math.min(orbitLayers, Math.ceil(orbitalNodes.length / 6)));
  const nodesPerLayer = Math.ceil(orbitalNodes.length / effectiveLayers);

  orbitalNodes.forEach((node, index) => {
    const tierIndex = Math.min(Math.floor(index / nodesPerLayer), effectiveLayers - 1);

    // Orbit radii: spread from 25% to 95% of max
    const t = effectiveLayers === 1 ? 0.6 : 0.25 + (tierIndex / (effectiveLayers - 1)) * 0.7;
    const orbitRx = maxRx * t;
    const orbitRy = maxRy * t;

    const nodesInThisTier = orbitalNodes.filter(
      (_, i) => Math.min(Math.floor(i / nodesPerLayer), effectiveLayers - 1) === tierIndex
    ).length;
    const indexInTier = index - tierIndex * nodesPerLayer;

    // Base angle with tier rotation offset for visual staggering
    const tierOffset = tierIndex * (Math.PI / effectiveLayers);
    const baseAngle = tierOffset + (indexInTier / nodesInThisTier) * 2 * Math.PI;

    // Add deterministic jitter via symbol hash
    const symbolHash = hashSymbol(node.symbol);
    const jitter = (symbolHash - 0.5) * (Math.PI / Math.max(10, nodesInThisTier));
    let angle = baseAngle + jitter;

    const myCollisionR = getCollisionRadius(node);
    let found = false;
    const maxAttempts = 60;

    for (let attempt = 0; attempt < maxAttempts && !found; attempt++) {
      const testX = width / 2 + Math.cos(angle) * orbitRx;
      const testY = height / 2 + Math.sin(angle) * orbitRy;

      // Bounds check
      if (testX < safeMarginX || testX > width - safeMarginX ||
          testY < safeMarginY || testY > height - safeMarginY) {
        angle += Math.PI / (nodesInThisTier * 3);
        continue;
      }

      // Collision check against all placed nodes
      let collision = false;
      for (const placed of placedNodes) {
        const dx = testX - placed.x;
        const dy = testY - placed.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = placed.collisionR + myCollisionR;
        if (dist < minDist) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        node.x = testX;
        node.y = testY;
        placedNodes.push({ x: testX, y: testY, collisionR: myCollisionR });
        found = true;
      } else {
        // Rotate angle and slightly expand orbit on later attempts
        angle += Math.PI / (nodesInThisTier * 2);
      }
    }

    // Fallback: place at slightly expanded orbit
    if (!found) {
      const fallbackAngle = baseAngle + symbolHash * Math.PI * 0.5;
      const expandFactor = 1.1;
      const rawX = width / 2 + Math.cos(fallbackAngle) * orbitRx * expandFactor;
      const rawY = height / 2 + Math.sin(fallbackAngle) * orbitRy * expandFactor;
      node.x = Math.max(safeMarginX, Math.min(width - safeMarginX, rawX));
      node.y = Math.max(safeMarginY, Math.min(height - safeMarginY, rawY));
      placedNodes.push({ x: node.x, y: node.y, collisionR: myCollisionR });
    }
  });

  return nodes;
};

export class NodePlacement {
  constructor(props: CalculateNodePositionsProps) {
    calculateNodePositions(props);
  }
}

export { hashSymbol };
