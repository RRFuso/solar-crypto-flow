
import React, { useEffect } from 'react';
import { CapitalFlowNode } from '@/types/capitalFlow';

export type OrbitalNode = CapitalFlowNode & {
  type: "central" | "orbital";
  symbol?: string;
  volume?: number | string;
  category?: string;
  divergenceBullish?: boolean;
  divergenceBearish?: boolean;
  inflow?: number;
  outflow?: number;
  marketCap: number;
};

interface NodePlacementProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

// Golden angle — guarantees no two nodes share a spoke across layers
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export const calculateNodePositions = (props: NodePlacementProps): OrbitalNode[] => {
  const { nodes, centralNode, width, height, orbitLayers } = props;

  if (!centralNode) return nodes;

  centralNode.x = width / 2;
  centralNode.y = height / 2;

  const nonCentralNodes = nodes
    .filter(n => n.id !== centralNode.id)
    .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

  if (nonCentralNodes.length === 0) return nodes;

  const total = nonCentralNodes.length;
  const safeMargin = 48;
  const maxR = Math.min(width, height) / 2 - safeMargin;
  // Inner orbit at 20% so nodes spread from near-center to near-edge
  const minR = maxR * 0.20;

  // Distribute nodes evenly across layers; outer layers can take one extra
  const effectiveLayers = Math.max(1, orbitLayers);
  const basePerLayer = Math.floor(total / effectiveLayers);
  const extras = total % effectiveLayers;
  const layerCounts: number[] = Array.from({ length: effectiveLayers }, (_, i) =>
    basePerLayer + (i < extras ? 1 : 0)
  );

  // Linear radius spacing
  const radii: number[] = Array.from({ length: effectiveLayers }, (_, l) =>
    effectiveLayers === 1 ? (minR + maxR) / 2 : minR + (l / (effectiveLayers - 1)) * (maxR - minR)
  );

  const cx = width / 2;
  const cy = height / 2;

  let layerIdx = 0;
  let posInLayer = 0;

  nonCentralNodes.forEach((node) => {
    const nodesInThisLayer = layerCounts[layerIdx];
    const r = radii[layerIdx];

    // Each layer starts at a golden-angle offset so spokes never overlap
    const angleOffset = layerIdx * GOLDEN_ANGLE * 13; // prime multiplier per orbit
    const angle = angleOffset + (posInLayer / nodesInThisLayer) * 2 * Math.PI;

    const rawX = cx + Math.cos(angle) * r;
    const rawY = cy + Math.sin(angle) * r;

    const half = (node.radius || 15) + 16;
    node.x = Math.max(half, Math.min(width - half, rawX));
    node.y = Math.max(half, Math.min(height - half, rawY));

    posInLayer++;
    if (posInLayer >= nodesInThisLayer) {
      layerIdx++;
      posInLayer = 0;
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
