
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
      const volume = parseFloat(cryptoInfo?.volume || '0'); 
      if (volume > maxVol) {
        maxVol = volume;
        maxVolNode = node;
      }
    });
    return maxVolNode || nodes[0]; 
  };

  const centralNode = findCentralNode();

  // --- Enhanced Logic for Volume-based Orbital Distribution ---
  let rankedNodesByVolume: { node: NarrativeNode; volume: number; rank: number }[] = [];
  if (centralNode && cryptoDataMap.size > 0) {
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      const nodesWithVolumes = nonCentralNodes.map(node => {
          const cryptoInfoById = cryptoDataMap.get(node.id);
          const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
          const volume = parseFloat(cryptoInfoById?.volume ?? cryptoInfoByName?.volume ?? '0');
          return { node, volume };
      })
      .sort((a, b) => (b.volume === 0 ? -1 : (a.volume === 0 ? 1 : b.volume - a.volume))); 

      rankedNodesByVolume = nodesWithVolumes.map((item, index) => ({ ...item, rank: index + 1 }));
  }
  
  const volumeRankMap = new Map(rankedNodesByVolume.map(item => [item.node.id, item.rank]));

  // **OPTIMIZED: Dramatically reduced orbital radii for better viewport fit**
  const calculateOrbitalRadiusByVolumeRank = (node: NarrativeNode, central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const rank = volumeRankMap.get(node.id);
    // **CRITICAL: Reduced base size by 50% for perfect viewport fit**
    const baseSize = Math.min(width, height) * 0.3; // Reduced from 0.6 to 0.3

    // **OPTIMIZED: Much more compact orbital radii**
    const orbitRadii = [
      baseSize * 0.12, // Orbit 1 (Highest Volume) - reduced from 0.15
      baseSize * 0.22, // Orbit 2 - reduced from 0.28
      baseSize * 0.32, // Orbit 3 - reduced from 0.40
      baseSize * 0.40  // Orbit 4 - reduced from 0.50
    ];

    // **ENHANCED: Better distribution thresholds**
    const rankThresholds = [
      8,  // Rank 1-8 -> Orbit 1 (reduced from 10)
      20, // Rank 9-20 -> Orbit 2 (reduced from 30)
      40  // Rank 21-40 -> Orbit 3 (reduced from 60)
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

  // **ENHANCED: Anti-collision positioning with angular distribution**
  const positionNodes = () => {
    if (!centralNode) return;
    centralNode.x = width / 2;
    centralNode.y = height / 2;
    
    const otherNodes = nodes.filter(n => n !== centralNode);
    
    // Group nodes by orbit
    const orbitGroups = new Map<number, NarrativeNode[]>();
    otherNodes.forEach(node => {
      const radius = calculateOrbitalRadiusByVolumeRank(node, centralNode);
      if (!orbitGroups.has(radius)) {
        orbitGroups.set(radius, []);
      }
      orbitGroups.get(radius)!.push(node);
    });
    
    // Position nodes within each orbit with optimal angular spacing
    orbitGroups.forEach((nodesInOrbit, radius) => {
      const angleStep = (2 * Math.PI) / nodesInOrbit.length;
      const startAngle = Math.random() * Math.PI * 2; // Random start to avoid clustering
      
      nodesInOrbit.forEach((node, index) => {
        const angle = startAngle + (index * angleStep);
        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      });
    });
  };

  // **ENHANCED: D3 Force Simulation with better collision handling**
  const simulation = d3.forceSimulation(nodes)
    // **OPTIMIZED: Enhanced collision with larger padding**
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 8) + 8).strength(1.0))
    // **OPTIMIZED: Reduced charge force for tighter clustering**
    .force("charge", d3.forceManyBody().strength(-20).distanceMax(width * 0.15))
    // **ENHANCED: Stronger radial force to maintain orbits**
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadiusByVolumeRank(d, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.5)) // Increased from 1.2 to 1.5
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
      simulation.alpha(0.6).restart(); 
  }, [nodes, cryptoDataMap, centralNode, width, height]); 

  // **ENHANCED: Apply bounds with better margin**
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 8;
      const margin = radius + 10; // Added extra margin
      node.x = typeof node.x === 'number' ? Math.max(margin, Math.min(width - margin, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(margin, Math.min(height - margin, node.y)) : height / 2;
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
    calculateOrbitalRadius: calculateOrbitalRadiusByVolumeRank 
  };
};
