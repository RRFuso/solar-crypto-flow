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
      // If no BTC and no market cap data, fallback to the first node as center (less ideal)
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
          // Default to 0 if no market cap found
          const marketCap = cryptoInfoById?.marketCap ?? cryptoInfoByName?.marketCap ?? 0;
          return { node, marketCap };
      })
      // Sort by market cap descending, nodes with 0 cap go to the end
      .sort((a, b) => (b.marketCap === 0 ? -1 : (a.marketCap === 0 ? 1 : b.marketCap - a.marketCap))); 

      rankedNodes = nodesWithCaps.map((item, index) => ({ ...item, rank: index + 1 }));
  }
  // Create a map for quick rank lookup
  const rankMap = new Map(rankedNodes.map(item => [item.node.id, item.rank]));

  // Calculate orbital radius based on RANKING
  const calculateOrbitalRadiusByRank = (node: NarrativeNode, central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const rank = rankMap.get(node.id);
    const baseSize = Math.min(width, height);

    // Define fixed orbital radii (adjust number and values as needed)
    const orbitRadii = [
      baseSize * 0.15, // Orbit 1 (Closest)
      baseSize * 0.25, // Orbit 2
      baseSize * 0.35, // Orbit 3
      baseSize * 0.45  // Orbit 4 (Farthest) - Also for nodes without rank/cap
    ];

    // Define rank thresholds for each orbit (exclusive of BTC)
    const rankThresholds = [
      10, // Rank 1-10 -> Orbit 1
      30, // Rank 11-30 -> Orbit 2
      60  // Rank 31-60 -> Orbit 3
          // Rank 61+ -> Orbit 4
    ];

    if (rank === undefined || rank <= 0) {
        // Node not found in ranking (e.g., no market cap), assign to outermost orbit
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
      // Use the rank-based radius for initial positioning
      const radius = calculateOrbitalRadiusByRank(node, centralNode);
      // Distribute evenly around the circle
      const angle = (index / otherNodes.length) * 2 * Math.PI; 
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });
  };

  // D3 Force Simulation - Adjusted for rank-based orbits
  const simulation = d3.forceSimulation(nodes)
    // Collision force: Adjust radius based on visual density in orbits
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 10) + 6).strength(0.8))
    // Charge force: May need less repulsion if collision handles spacing well
    .force("charge", d3.forceManyBody().strength(-60).distanceMax(width * 0.3))
    // Radial force using the RANK-BASED radius calculation
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadiusByRank(d, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.1)) // Strong strength to keep nodes in their fixed orbits
    .alphaDecay(0.0228) 
    .velocityDecay(0.4);

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
      }
      // Update node data (including ranks) and restart simulation
      simulation.nodes(nodes); 
      // Re-calculate ranks if nodes/data change significantly (outside this hook's scope)
      // Apply initial positioning based on ranks
      positionNodes(); 
      simulation.alpha(0.5).restart(); // Give simulation a good start
  }, [nodes, cryptoDataMap, centralNode, width, height]); // Re-run if nodes, data, or dimensions change

  // Apply bounds
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 10;
      node.x = typeof node.x === 'number' ? Math.max(radius, Math.min(width - radius, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius, Math.min(height - radius, node.y)) : height / 2;
    });
  };

  // Drag handlers (no changes needed here)
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
    // Expose the rank-based radius function if needed elsewhere
    calculateOrbitalRadius: calculateOrbitalRadiusByRank 
  };
};

