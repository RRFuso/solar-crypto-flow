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

  // Filter out the central node for orbital distribution
  const orbitalNodes = nodes.filter(node => node.id !== centralNode.id);

  // Evenly distribute nodes across orbit layers
  const nodesPerLayer = Math.ceil(orbitalNodes.length / orbitLayers);

  orbitalNodes.forEach((node, i) => {
    const layer = Math.floor(i / nodesPerLayer);
    const angle = (i % nodesPerLayer) / nodesPerLayer * 2 * Math.PI;
    const radius = baseRadius * (layer + 1);

    node.x = width / 2 + radius * Math.cos(angle);
    node.y = height / 2 + radius * Math.sin(angle);
  });
};
