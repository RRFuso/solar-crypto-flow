
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
  const safeMargin = 36;

  // Elliptical radii — fill the rectangle while keeping oval/solar shape
  const maxRx = width / 2 - safeMargin;
  const maxRy = height / 2 - safeMargin;
  // Inner orbit starts at 30% so central nodes aren't crammed together
  const minRx = maxRx * 0.30;
  const minRy = maxRy * 0.30;

  const effectiveLayers = Math.max(1, orbitLayers);
  const basePerLayer = Math.floor(total / effectiveLayers);
  const extras = total % effectiveLayers;
  // Outer layers get extra nodes (more circumference)
  const layerCounts: number[] = Array.from({ length: effectiveLayers }, (_, i) =>
    basePerLayer + (i >= effectiveLayers - extras ? 1 : 0)
  );

  // Sqrt spacing — inner orbits get more breathing room
  const radiiX: number[] = Array.from({ length: effectiveLayers }, (_, l) => {
    if (effectiveLayers === 1) return (minRx + maxRx) / 2;
    const t = l / (effectiveLayers - 1);
    return minRx + Math.sqrt(t) * (maxRx - minRx);
  });
  const radiiY: number[] = Array.from({ length: effectiveLayers }, (_, l) => {
    if (effectiveLayers === 1) return (minRy + maxRy) / 2;
    const t = l / (effectiveLayers - 1);
    return minRy + Math.sqrt(t) * (maxRy - minRy);
  });

  const cx = width / 2;
  const cy = height / 2;

  let layerIdx = 0;
  let posInLayer = 0;

  nonCentralNodes.forEach((node) => {
    const nodesInThisLayer = layerCounts[layerIdx];
    const rx = radiiX[layerIdx];
    const ry = radiiY[layerIdx];

    // Golden-angle offset per layer so spokes never overlap
    const angleOffset = layerIdx * GOLDEN_ANGLE * 13;
    const angle = angleOffset + (posInLayer / nodesInThisLayer) * 2 * Math.PI;

    // Elliptical placement
    const rawX = cx + Math.cos(angle) * rx;
    const rawY = cy + Math.sin(angle) * ry;

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
