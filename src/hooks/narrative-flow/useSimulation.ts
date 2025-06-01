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
      return maxCapNode || nodes[0]; // Return first node if no market cap data available
    }
    return btcNode;
  };

  const centralNode = findCentralNode();

  // Calculate orbital radius based on market cap with adjusted scale for 100% zoom visibility
  const calculateOrbitalRadius = (node: NarrativeNode, allNodes: NarrativeNode[], central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const cryptoInfoById = cryptoDataMap.get(node.id);
    const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
    const marketCap = cryptoInfoById?.marketCap ?? cryptoInfoByName?.marketCap ?? 0;

    const validMarketCaps = allNodes
      .filter(n => n !== central)
      .map(n => cryptoDataMap.get(n.id)?.marketCap ?? cryptoDataMap.get(n.name.toUpperCase())?.marketCap ?? 0)
      .filter(cap => cap > 0);

    // Define min/max orbital radii significantly reduced for better viewport fit
    // Adjust these values based on visual testing to match desired density at 100% zoom
    const baseSize = Math.min(width, height);
    const minRadius = baseSize * 0.1;  // e.g., 10% of the smaller dimension for the closest orbit
    const maxRadius = baseSize * 0.35; // e.g., 35% of the smaller dimension for the farthest orbit

    if (validMarketCaps.length === 0 || marketCap <= 0) {
      return maxRadius; // Place nodes with invalid/zero market cap at the outermost orbit
    }

    const minMarketCap = Math.min(...validMarketCaps);
    const maxMarketCap = Math.max(...validMarketCaps);

    if (maxMarketCap === minMarketCap) {
        return (minRadius + maxRadius) / 2; // Place all in a middle orbit if caps are the same
    }

    // Use inverse log scale: higher market cap -> smaller radius
    const logMin = Math.log10(minMarketCap);
    const logMax = Math.log10(maxMarketCap);
    const logCap = marketCap > 0 ? Math.log10(marketCap) : logMin;

    let normalizedLog = 0;
    if (logMax > logMin) {
        normalizedLog = Math.max(0, Math.min(1, (logCap - logMin) / (logMax - logMin)));
    }
    
    // Apply exponential curve for distribution (optional, adjust exponent for feel)
    const exponentialFactor = Math.pow(normalizedLog, 0.7); 
    const radius = maxRadius - exponentialFactor * (maxRadius - minRadius);
    
    return Math.max(minRadius, Math.min(maxRadius, radius));
  };

  // Position nodes initially (optional, simulation will arrange them)
  const positionNodes = () => {
    if (!centralNode) return;
    centralNode.x = width / 2;
    centralNode.y = height / 2;
    const otherNodes = nodes.filter(n => n !== centralNode);
    otherNodes.forEach((node, index) => {
      const radius = calculateOrbitalRadius(node, nodes, centralNode);
      const angle = (index / otherNodes.length) * 2 * Math.PI;
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });
  };

  // D3 Force Simulation - Adjusted forces for the new scale
  const simulation = d3.forceSimulation(nodes)
    // Adjust collision radius based on node size and desired spacing at the new scale
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 10) + 5).strength(0.9))
    // Adjust charge strength and distance for the new scale
    .force("charge", d3.forceManyBody().strength(-80).distanceMax(baseSize * 0.2))
    // Radial force to maintain orbits - strength might need tuning
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadius(d, nodes, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.2)) // Slightly increased strength to enforce orbits more strictly
    .alphaDecay(0.0228) 
    .velocityDecay(0.4);

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
      }
      // Give simulation a nudge when parameters change
      simulation.alpha(0.3).restart(); 
  }, [centralNode, width, height]); // Removed simulation from dependencies to avoid loop

  // Apply bounds to keep nodes within the SVG area
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = node.radius || 10; // Use base radius for bounds checking
      node.x = typeof node.x === 'number' ? Math.max(radius, Math.min(width - radius, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius, Math.min(height - radius, node.y)) : height / 2;
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
    calculateOrbitalRadius
  };
};

