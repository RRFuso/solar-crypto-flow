
import { FlowData } from '@/types/crypto';

export type OrbitalNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
  marketCap?: number;
  type: 'central' | 'orbital';
  category?: string;
  categories?: string[];
  netFlow?: number;  // Net flow value (positive for inflow, negative for outflow)
  flowColor?: string; // Color based on flow direction
};

export interface CalculateNodePositionsProps {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
}

export function calculateNodePositions({ 
  nodes, 
  centralNode, 
  width, 
  height,
  orbitLayers,
  baseRadius
}: CalculateNodePositionsProps) {
  // Position central node in the middle
  centralNode.x = width / 2;
  centralNode.y = height / 2;
  
  // Get non-central nodes
  const nonCentralNodes = nodes.filter(node => node.id !== centralNode.id);
  
  // Calculate the orbit radius for each layer
  const orbitRadiusStep = baseRadius;
  
  // Distribute nodes into layers based on market cap
  const nodeLayers = distributeNodesIntoLayers(nonCentralNodes, orbitLayers);
  
  // Position nodes in each layer
  nodeLayers.forEach((layerNodes, layerIndex) => {
    const orbitRadius = (layerIndex + 1) * orbitRadiusStep;
    positionNodesInOrbit(layerNodes, width / 2, height / 2, orbitRadius);
  });
}

function distributeNodesIntoLayers(nodes: OrbitalNode[], layerCount: number): OrbitalNode[][] {
  // Sort nodes by market cap (descending)
  const sortedNodes = [...nodes].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  
  // Calculate how many nodes per layer
  const nodesPerLayer = Math.ceil(sortedNodes.length / layerCount);
  
  // Distribute nodes into layers
  const layers: OrbitalNode[][] = [];
  for (let i = 0; i < layerCount; i++) {
    const start = i * nodesPerLayer;
    const end = Math.min(start + nodesPerLayer, sortedNodes.length);
    if (start < end) {
      layers.push(sortedNodes.slice(start, end));
    }
  }
  
  return layers;
}

function positionNodesInOrbit(nodes: OrbitalNode[], centerX: number, centerY: number, radius: number) {
  const angleStep = (2 * Math.PI) / nodes.length;
  
  nodes.forEach((node, i) => {
    const angle = i * angleStep;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });
}

export function calculateNetFlows(flowData: FlowData[]): Record<string, number> {
  const netFlows: Record<string, number> = {};
  
  flowData.forEach(flow => {
    // Subtract from source (outflow)
    netFlows[flow.from] = (netFlows[flow.from] || 0) - flow.value;
    
    // Add to target (inflow)
    netFlows[flow.to] = (netFlows[flow.to] || 0) + flow.value;
  });
  
  return netFlows;
}
