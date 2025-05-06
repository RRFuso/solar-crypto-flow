
import { FlowData } from '@/types/crypto';

export interface OrbitalNode {
  id: string;
  name?: string;
  radius: number;
  x: number;
  y: number;
  type?: 'central' | 'orbital';
  category?: string;
  categories?: string[];
  flowValue?: number; // Added to track flow value (positive for inflow, negative for outflow)
}

interface CalculateNodePositionsProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export interface NodePlacementResult {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
}

// Calculate node positions in orbital arrangement
export const calculateNodePositions = ({
  nodes,
  centralNode,
  width,
  height,
  orbitLayers,
  baseRadius
}: CalculateNodePositionsProps): void => {
  if (!centralNode) return;
  
  // Position central node in center
  centralNode.x = width / 2;
  centralNode.y = height / 2;
  
  const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
  const nodesPerLayer = Math.ceil(nonCentralNodes.length / orbitLayers);
  
  // Group nodes into layers based on radius (size)
  nonCentralNodes.sort((a, b) => b.radius - a.radius);
  
  // Place nodes in orbital layers
  nonCentralNodes.forEach((node, i) => {
    const layerIndex = Math.min(orbitLayers - 1, Math.floor(i / nodesPerLayer));
    const orbitRadius = baseRadius * (layerIndex + 1);
    
    // Calculate position in the orbit
    const nodeAngle = (i % nodesPerLayer) * (2 * Math.PI / nodesPerLayer);
    
    // Position the node
    node.x = width / 2 + orbitRadius * Math.cos(nodeAngle);
    node.y = height / 2 + orbitRadius * Math.sin(nodeAngle);
  });
};

// Process flow data to create nodes
export const processFlowData = (flowData: FlowData[]): NodePlacementResult => {
  // Find unique crypto IDs from flows
  const uniqueCryptos = new Set<string>();
  
  flowData.forEach(flow => {
    uniqueCryptos.add(flow.from);
    uniqueCryptos.add(flow.to);
  });
  
  // Create base nodes
  const nodes: OrbitalNode[] = Array.from(uniqueCryptos).map(id => ({
    id,
    name: id,
    radius: 20, // Default radius
    x: 0,
    y: 0,
    type: id === 'BTC' ? 'central' : 'orbital',
    flowValue: 0 // Initialize flow value
  }));
  
  // Calculate flow values for each node
  flowData.forEach(flow => {
    const fromNode = nodes.find(n => n.id === flow.from);
    const toNode = nodes.find(n => n.id === flow.to);
    
    if (fromNode) fromNode.flowValue = (fromNode.flowValue || 0) - flow.value;
    if (toNode) toNode.flowValue = (toNode.flowValue || 0) + flow.value;
  });
  
  // Find central node (default to BTC or first node)
  const centralNode = nodes.find(n => n.type === 'central') || nodes[0];
  if (centralNode) {
    centralNode.type = 'central';
    centralNode.radius = 40; // Make central node bigger
  }
  
  // Adjust other node sizes based on their flow values
  const maxFlowValue = Math.max(...nodes.map(n => Math.abs(n.flowValue || 0)));
  
  if (maxFlowValue > 0) {
    nodes.forEach(node => {
      if (node !== centralNode) {
        // Scale node size by flow value (min 12, max 30)
        const flowRatio = Math.abs(node.flowValue || 0) / maxFlowValue;
        node.radius = 12 + flowRatio * 18;
      }
    });
  }
  
  return { nodes, centralNode };
};
