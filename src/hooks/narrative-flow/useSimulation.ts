
import { useEffect } from 'react';
import { NarrativeNode } from '@/types/narratives';
import { CryptoData } from '@/types/crypto';

interface SimulationConfig {
  nodes: NarrativeNode[];
  cryptoDataMap?: Map<string, CryptoData>;
  width: number;
  height: number;
}

export const useSimulation = ({ nodes, cryptoDataMap = new Map(), width, height }: SimulationConfig) => {

  // Find BTC node (central node) using native JavaScript
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

  // Enhanced Logic for Volume-based Orbital Distribution using native JavaScript
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

  // Calculate orbital radius by volume rank using native calculations
  const calculateOrbitalRadiusByVolumeRank = (node: NarrativeNode, central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const rank = volumeRankMap.get(node.id);
    const baseSize = Math.min(width, height) * 0.35;

    const orbitRadii = [
      baseSize * 0.25, // Orbit 1 (Highest Volume)
      baseSize * 0.40, // Orbit 2
      baseSize * 0.55, // Orbit 3
      baseSize * 0.70  // Orbit 4
    ];

    const rankThresholds = [6, 15, 30];

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

  // Position nodes using native JavaScript calculations
  const positionNodes = () => {
    if (!centralNode) return;
    centralNode.x = width / 2;
    centralNode.y = height / 2;
    
    const otherNodes = nodes.filter(n => n !== centralNode);
    
    // Group nodes by orbit with uniform distribution
    const orbitGroups = new Map<number, NarrativeNode[]>();
    otherNodes.forEach(node => {
      const radius = calculateOrbitalRadiusByVolumeRank(node, centralNode);
      if (!orbitGroups.has(radius)) {
        orbitGroups.set(radius, []);
      }
      orbitGroups.get(radius)!.push(node);
    });
    
    // Position nodes within each orbit with perfect spacing
    orbitGroups.forEach((nodesInOrbit, radius) => {
      const angleStep = (2 * Math.PI) / nodesInOrbit.length;
      const startAngle = Math.random() * Math.PI * 2;
      
      nodesInOrbit.forEach((node, index) => {
        const angle = startAngle + (index * angleStep);
        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      });
    });
  };

  // Simple physics simulation using native JavaScript
  const simulation = {
    nodes: nodes,
    alpha: 1,
    alphaTarget: 0,
    alphaDecay: 0.0228,
    velocityDecay: 0.4,
    restart: function() {
      this.alpha = 0.6;
      return this;
    },
    stop: function() {
      this.alpha = 0;
      return this;
    }
  };

  // Apply collision detection and orbital forces
  const applyForces = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      
      // Apply orbital force
      const targetRadius = calculateOrbitalRadiusByVolumeRank(node, centralNode);
      const dx = (node.x || 0) - width / 2;
      const dy = (node.y || 0) - height / 2;
      const currentRadius = Math.sqrt(dx * dx + dy * dy);
      
      if (currentRadius > 0) {
        const force = (targetRadius - currentRadius) * 0.1;
        const angle = Math.atan2(dy, dx);
        node.x = (node.x || 0) + Math.cos(angle) * force;
        node.y = (node.y || 0) + Math.sin(angle) * force;
      }
      
      // Apply collision detection
      nodes.forEach(otherNode => {
        if (node === otherNode) return;
        const dx = (node.x || 0) - (otherNode.x || 0);
        const dy = (node.y || 0) - (otherNode.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (node.radius || 8) + (otherNode.radius || 8) + 12;
        
        if (distance < minDistance && distance > 0) {
          const force = (minDistance - distance) * 0.1;
          const angle = Math.atan2(dy, dx);
          node.x = (node.x || 0) + Math.cos(angle) * force;
          node.y = (node.y || 0) + Math.sin(angle) * force;
        }
      });
    });
  };

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.x = width / 2;
          centralNode.y = height / 2;
      }
      positionNodes(); 
      // Start simple animation loop
      const animate = () => {
        applyForces();
        requestAnimationFrame(animate);
      };
      animate();
  }, [nodes, cryptoDataMap, centralNode, width, height]); 

  // Apply bounds using native calculations
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 8;
      const margin = radius + 15;
      node.x = typeof node.x === 'number' ? Math.max(margin, Math.min(width - margin, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(margin, Math.min(height - margin, node.y)) : height / 2;
    });
  };

  // Drag handlers using native event handling
  const dragHandlers = {
    dragstarted: (event: any) => {
      event.subject.x = event.x;
      event.subject.y = event.y;
    },
    dragged: (event: any) => {
      if (event.subject === centralNode) return;
      event.subject.x = event.x;
      event.subject.y = event.y;
    },
    dragended: (event: any) => {
      // End drag
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
