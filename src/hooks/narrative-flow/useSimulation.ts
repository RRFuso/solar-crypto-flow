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
    // Prioritize finding BTC by symbol or name
    const btcNode = nodes.find(node => 
      node.tokens?.includes('BTC') || node.name.toLowerCase() === 'bitcoin'
    );
    if (btcNode) return btcNode;

    // Fallback: Find node with highest volume if BTC not explicitly found
    let maxVolNode: NarrativeNode | null = null;
    let maxVol = -1;
    nodes.forEach(node => {
      const cryptoInfo = cryptoDataMap.get(node.id) || cryptoDataMap.get(node.name.toUpperCase());
      // Use volume for fallback central node selection
      const volume = parseFloat(cryptoInfo?.volume || '0'); 
      if (volume > maxVol) {
        maxVol = volume;
        maxVolNode = node;
      }
    });
    // If no volume data, fallback to the first node
    return maxVolNode || nodes[0]; 
  };

  const centralNode = findCentralNode();

  // --- Logic for Ranking by VOLUME and Fixed Orbits ---
  let rankedNodesByVolume: { node: NarrativeNode; volume: number; rank: number }[] = [];
  if (centralNode && cryptoDataMap.size > 0) {
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      const nodesWithVolumes = nonCentralNodes.map(node => {
          const cryptoInfoById = cryptoDataMap.get(node.id);
          const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
          // Use volume for ranking, default to 0 if missing
          const volume = parseFloat(cryptoInfoById?.volume ?? cryptoInfoByName?.volume ?? '0');
          return { node, volume };
      })
      // Sort by VOLUME descending, nodes with 0 volume go to the end
      .sort((a, b) => (b.volume === 0 ? -1 : (a.volume === 0 ? 1 : b.volume - a.volume))); 

      rankedNodesByVolume = nodesWithVolumes.map((item, index) => ({ ...item, rank: index + 1 }));
  }
  // Create a map for quick volume rank lookup
  const volumeRankMap = new Map(rankedNodesByVolume.map(item => [item.node.id, item.rank]));

  // Calculate orbital radius based on VOLUME RANKING - Using compact radii from previous fix
  const calculateOrbitalRadiusByVolumeRank = (node: NarrativeNode, central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const rank = volumeRankMap.get(node.id);
    const baseSize = Math.min(width, height) * 0.6; // Keep the compact base size

    // Define fixed orbital radii (same compact values)
    const orbitRadii = [
      baseSize * 0.15, // Orbit 1 (Highest Volume)
      baseSize * 0.28, // Orbit 2
      baseSize * 0.40, // Orbit 3
      baseSize * 0.50  // Orbit 4 (Lowest Volume / No Rank)
    ];

    // Define rank thresholds for each orbit (adjust based on desired distribution by volume)
    const rankThresholds = [
      10, // Rank 1-10 (Highest Volume) -> Orbit 1
      30, // Rank 11-30 -> Orbit 2
      60  // Rank 31-60 -> Orbit 3
          // Rank 61+ (Lowest Volume) -> Orbit 4
    ];

    if (rank === undefined || rank <= 0) {
        // Node not found in ranking (e.g., no volume), assign to outermost orbit
        return orbitRadii[orbitRadii.length - 1];
    }

    // Assign orbit based on volume rank
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
      // Use the volume-rank-based radius for initial positioning
      const radius = calculateOrbitalRadiusByVolumeRank(node, centralNode);
      const angle = (index / otherNodes.length) * 2 * Math.PI; 
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });
  };

  // D3 Force Simulation - Adjusted for volume-rank-based orbits
  const simulation = d3.forceSimulation(nodes)
    // Collision force: Keep settings for compact view
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 8) + 4).strength(0.9))
    // Charge force: Keep settings for compact view
    .force("charge", d3.forceManyBody().strength(-40).distanceMax(width * 0.2))
    // Radial force using the VOLUME-RANK-BASED radius calculation
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadiusByVolumeRank(d, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.2)) // Keep strength high to enforce orbits
    .alphaDecay(0.0228) 
    .velocityDecay(0.4);

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
      }
      // Update nodes and restart simulation when dependencies change
      simulation.nodes(nodes); 
      // Re-calculate ranks and apply initial positioning
      // Note: Ranking logic runs at the start of the hook execution
      positionNodes(); 
      simulation.alpha(0.6).restart(); 
  // Dependencies now include cryptoDataMap as volume data might change
  }, [nodes, cryptoDataMap, centralNode, width, height]); 

  // Apply bounds
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 8;
      node.x = typeof node.x === 'number' ? Math.max(radius, Math.min(width - radius, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius, Math.min(height - radius, node.y)) : height / 2;
    });
  };

  // Drag handlers (no changes needed)
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
    // Expose the volume-rank-based radius function if needed
    calculateOrbitalRadius: calculateOrbitalRadiusByVolumeRank 
  };
};

