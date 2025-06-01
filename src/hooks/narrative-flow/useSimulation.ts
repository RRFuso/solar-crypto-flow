
import { useEffect } from 'react';
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { CryptoData } from '@/types/crypto';

interface SimulationConfig {
  nodes: NarrativeNode[];
  cryptoDataMap: Map<string, CryptoData>;
  width: number;
  height: number;
}

export const useSimulation = ({ nodes, cryptoDataMap, width, height }: SimulationConfig) => {

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
      return maxCapNode;
    }
    return btcNode;
  };

  const centralNode = findCentralNode();

  // Calculate orbital radius based on market cap with improved spacing
  const calculateOrbitalRadius = (node: NarrativeNode, allNodes: NarrativeNode[], central: NarrativeNode | null) => {
    if (!central || node === central) return 0;

    const cryptoInfoById = cryptoDataMap.get(node.id);
    const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
    const marketCap = cryptoInfoById?.marketCap ?? cryptoInfoByName?.marketCap ?? 0;

    const validMarketCaps = allNodes
      .filter(n => n !== central)
      .map(n => cryptoDataMap.get(n.id)?.marketCap ?? cryptoDataMap.get(n.name.toUpperCase())?.marketCap ?? 0)
      .filter(cap => cap > 0);

    if (validMarketCaps.length === 0 || marketCap <= 0) {
      return Math.min(width, height) * 0.4; // Increased max radius for better spacing
    }

    const minMarketCap = Math.min(...validMarketCaps);
    const maxMarketCap = Math.max(...validMarketCaps);

    // Significantly increased orbital spacing
    const minRadius = Math.min(width, height) * 0.2; // Increased from 0.15
    const maxRadius = Math.min(width, height) * 0.45; // Slightly increased

    if (maxMarketCap === minMarketCap) {
        return (minRadius + maxRadius) / 2;
    }

    // Enhanced logarithmic scale for better distribution
    const logMin = Math.log10(minMarketCap);
    const logMax = Math.log10(maxMarketCap);
    const logCap = marketCap > 0 ? Math.log10(marketCap) : logMin;

    let normalizedLog = 0;
    if (logMax > logMin) {
        normalizedLog = Math.max(0, Math.min(1, (logCap - logMin) / (logMax - logMin)));
    }
    
    // Apply exponential curve for more pronounced separation
    const exponentialFactor = Math.pow(normalizedLog, 0.7); // Smoother distribution
    const radius = maxRadius - exponentialFactor * (maxRadius - minRadius);
    
    return Math.max(minRadius, Math.min(maxRadius, radius));
  };

  // Enhanced D3 Force Simulation with better spacing
  const simulation = d3.forceSimulation(nodes)
    // Significantly increased collision detection with larger padding
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 20) * 2.5).strength(1.2))
    // Stronger repulsion for better node separation
    .force("charge", d3.forceManyBody().strength(-300).distanceMax(200)) 
    // Enhanced radial force with stronger pull to maintain orbits
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadius(d, nodes, centralNode), 
        width / 2, 
        height / 2
      ).strength(1.5)) // Increased strength to maintain orbital positions
    .alphaDecay(0.02) // Slower decay for more stable positioning
    .velocityDecay(0.5); // Increased decay for less jittery movement

  // Fix the central node's position with enhanced stability
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
          
          // Add slight warming to help with positioning
          simulation.alpha(0.4).restart();
          
          // Add a tick listener to maintain central node position
          const maintainCenter = () => {
            if (centralNode) {
              centralNode.fx = width / 2;
              centralNode.fy = height / 2;
            }
          };
          
          simulation.on('tick', maintainCenter);
          
          return () => {
            simulation.on('tick', null);
          };
      }
  }, [centralNode, width, height, simulation]);

  // Enhanced bounds checking with better margin calculation
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return;
      const radius = (node.radius || 20) * 1.5; // Increased margin
      node.x = typeof node.x === 'number' ? Math.max(radius, Math.min(width - radius, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius, Math.min(height - radius, node.y)) : height / 2;
    });
  };

  // Enhanced drag handlers with better stability
  const dragHandlers = {
    dragstarted: (event: any) => {
      if (!event.active) simulation.alphaTarget(0.4).restart(); // Increased alpha target
      event.subject.startX = event.subject.x;
      event.subject.startY = event.subject.y;
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    },
    dragged: (event: any) => {
      if (event.subject === centralNode) return; // Keep central node fixed
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    dragended: (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      if (event.subject === centralNode) {
        // Ensure central node stays fixed
        event.subject.fx = width / 2;
        event.subject.fy = height / 2;
      } else {
        // Release other nodes but with gentle transition
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  };

  return {
    simulation,
    applyBounds,
    dragHandlers,
    centralNode,
    calculateOrbitalRadius // Export for use in other components
  };
};
