
import { useEffect } from 'react';
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { CryptoData } from '@/types/crypto';

interface SimulationConfig {
  nodes: NarrativeNode[];
  cryptoDataMap?: Map<string, CryptoData>;
  width: number;
  height: number;
}

export const useSimulation = ({ nodes, cryptoDataMap = new Map(), width, height }: SimulationConfig) => {

  // Find BTC node (central node)
  const findCentralNode = () => {
    if (nodes.length === 0) return null;
    const btcNode = nodes.find(node => 
      node.tokens?.includes('BTC') || node.name.toLowerCase() === 'bitcoin'
    );
    if (!btcNode) {
      let maxCapNode: NarrativeNode | null = null;
      let maxCap = -1;
      nodes.forEach(node => {
        const cryptoInfo = cryptoDataMap.get(node.id) || cryptoDataMap.get(node.name.toUpperCase());
        const marketCap = cryptoInfo?.marketCap ?? 0;
        if (marketCap > maxCap) {
          maxCap = marketCap;
          maxCapNode = node;
        }
      });
      return maxCapNode || nodes[0]; 
    }
    return btcNode;
  };

  const centralNode = findCentralNode();

  // --- Logic for Ranking and Fixed Orbits ---
  let rankedNodes: { node: NarrativeNode; marketCap: number; rank: number }[] = [];
  if (centralNode && cryptoDataMap.size > 0) {
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      const nodesWithCaps = nonCentralNodes.map(node => {
          const cryptoInfoById = cryptoDataMap.get(node.id);
          const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
          const marketCap = cryptoInfoById?.marketCap ?? cryptoInfoByName?.marketCap ?? 0;
          return { node, marketCap };
      })
      .sort((a, b) => (b.marketCap === 0 ? -1 : (a.marketCap === 0 ? 1 : b.marketCap - a.marketCap))); 

      rankedNodes = nodesWithCaps.map((item, index) => ({ ...item, rank: index + 1 }));
  }
  const rankMap = new Map(rankedNodes.map(item => [item.node.id, item.rank]));

  // Calculate orbital radius based on RANKING - **Drastically Reduced for Viewport Fit**
  const calculateOrbitalRadiusByRank = (node: NarrativeNode, central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const rank = rankMap.get(node.id);
    // **CRITICAL FIX: Drastically reduced base size for perfect viewport fit**
    const baseSize = Math.min(width, height) * 0.35; // Reduced from 0.6 to 0.35

    // **SIGNIFICANTLY SMALLER orbital radii for 100% zoom viewport fit**
    const orbitRadii = [
      baseSize * 0.12, // Orbit 1 - Very close (was 0.15)
      baseSize * 0.22, // Orbit 2 - Close (was 0.28) 
      baseSize * 0.32, // Orbit 3 - Medium (was 0.40)
      baseSize * 0.40  // Orbit 4 - Far (was 0.50)
    ];

    // **Adjusted rank thresholds for better distribution**
    const rankThresholds = [
      8,  // Rank 1-8 -> Orbit 1 (reduced from 10)
      20, // Rank 9-20 -> Orbit 2 (reduced from 30)
      40  // Rank 21-40 -> Orbit 3 (reduced from 60)
        // Rank 41+ -> Orbit 4
    ];

    if (rank === undefined || rank <= 0) {
        return orbitRadii[orbitRadii.length - 1];
    }

    if (rank <= rankThresholds[0]) {
      return orbitRadii[0];
    } else if (rank <= rankThresholds[1]) {
      return orbitRadii[1];
    } else if (rank <= rankThresholds[2]) {
      return orbitRadii[2];
    } else {
      return orbitRadii[3];
    }
  };

  // Position nodes initially (optional)
  const positionNodes = () => {
    if (!centralNode) return;
    centralNode.x = width / 2;
    centralNode.y = height / 2;
    const otherNodes = nodes.filter(n => n !== centralNode);
    otherNodes.forEach((node, index) => {
      const radius = calculateOrbitalRadiusByRank(node, centralNode);
      const angle = (index / otherNodes.length) * 2 * Math.PI; 
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });
  };

  // **D3 Force Simulation - Adjusted for much smaller scale**
  const simulation = d3.forceSimulation(nodes)
    // **Collision force: Reduced radius for tighter packing**
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 6) + 2).strength(0.8))
    // **Charge force: Reduced strength and distance for smaller scale**
    .force("charge", d3.forceManyBody().strength(-25).distanceMax(width * 0.15))
    // **Radial force: Using the RANK-BASED radius calculation**
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadiusByRank(d, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.0)) // Slightly reduced strength for smoother movement
    .alphaDecay(0.0228) 
    .velocityDecay(0.4);

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
      }
      simulation.nodes(nodes); 
      positionNodes(); 
      simulation.alpha(0.5).restart(); // Reduced alpha for faster settling
  }, [nodes, cryptoDataMap, centralNode, width, height]);

  // Apply bounds - **Tighter bounds for viewport fit**
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 6; // Reduced default radius
      node.x = typeof node.x === 'number' ? Math.max(radius + 10, Math.min(width - radius - 10, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius + 10, Math.min(height - radius - 10, node.y)) : height / 2;
    });
  };

  // Drag handlers
  const dragHandlers = {
    dragstarted: (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    },
    dragged: (event: any) => {
      if (event.subject === centralNode) return;
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    dragended: (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      if (event.subject !== centralNode) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  };

  return {
    simulation,
    positionNodes, 
    applyBounds,
    dragHandlers,
    centralNode,
    calculateOrbitalRadius: calculateOrbitalRadiusByRank 
  };
};
