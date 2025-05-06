export interface OrbitalNode {
  id: string;
  x: number;
  y: number;
  radius: number;  
  type: "central" | "orbital";
  marketCap?: number;
  category?: string;
  categories?: string[];
  flowPercentage?: number; // Added field for inflow/outflow visualization
}

export const calculateNodePositions = ({
  nodes,
  centralNode,
  width,
  height,
  orbitLayers,
  baseRadius
}: {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}) => {
  // Filter out the central node for orbital calculations
  const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
  
  // Evenly distribute nodes across the available orbit layers
  nonCentralNodes.forEach((node, i) => {
    const layer = i % orbitLayers;
    const nodesPerLayer = Math.ceil(nonCentralNodes.length / orbitLayers);
    const angleIncrement = (2 * Math.PI) / nodesPerLayer;
    const angle = (i % nodesPerLayer) * angleIncrement;
    
    // Calculate the radius for this node's orbit
    const orbitRadius = baseRadius * (layer + 1);
    
    // Calculate the node's position
    node.x = width / 2 + orbitRadius * Math.cos(angle);
    node.y = height / 2 + orbitRadius * Math.sin(angle);
  });
  
  // Place central node in the middle
  centralNode.x = width / 2;
  centralNode.y = height / 2;
};
