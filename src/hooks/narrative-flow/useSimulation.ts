import { useEffect } from 'react';
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { CryptoData } from '@/types/crypto'; // Import CryptoData for marketCap access

interface SimulationConfig {
  nodes: NarrativeNode[]; // NarrativeNode might need marketCap or be linked to CryptoData
  cryptoDataMap: Map<string, CryptoData>; // Pass map for easy marketCap lookup
  width: number;
  height: number;
}

export const useSimulation = ({ nodes, cryptoDataMap, width, height }: SimulationConfig) => {

  // Find BTC node (central node)
  const findCentralNode = () => {
    if (nodes.length === 0) return null;
    // Prioritize BTC symbol if available in NarrativeNode, otherwise check name
    const btcNode = nodes.find(node => 
      node.tokens?.includes('BTC') || node.name.toLowerCase() === 'bitcoin'
    );
    // If no specific BTC node, fallback to the one with highest market cap from the provided map
    if (!btcNode) {
      let maxCapNode: NarrativeNode | null = null;
      let maxCap = -1;
      nodes.forEach(node => {
        // Assuming node.id or node.name can map to cryptoDataMap key (symbol or id)
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

  // Calculate orbital radius based on market cap
  const calculateOrbitalRadius = (node: NarrativeNode, allNodes: NarrativeNode[], central: NarrativeNode | null) => {
    if (!central || node === central) return 0; // Central node has radius 0

    // Try to get market cap using node.id first, then node.name
    const cryptoInfoById = cryptoDataMap.get(node.id);
    const cryptoInfoByName = cryptoDataMap.get(node.name.toUpperCase());
    const marketCap = cryptoInfoById?.marketCap ?? cryptoInfoByName?.marketCap ?? 0;

    // Filter non-central nodes with valid marketCap > 0
    const validMarketCaps = allNodes
      .filter(n => n !== central)
      .map(n => cryptoDataMap.get(n.id)?.marketCap ?? cryptoDataMap.get(n.name.toUpperCase())?.marketCap ?? 0)
      .filter(cap => cap > 0);

    if (validMarketCaps.length === 0 || marketCap <= 0) {
      // Assign max radius if no valid caps or node has invalid cap
      return Math.min(width, height) * 0.45; 
    }

    const minMarketCap = Math.min(...validMarketCaps);
    const maxMarketCap = Math.max(...validMarketCaps);

    // Define min/max orbital radii (adjust as needed)
    const minRadius = Math.min(width, height) * 0.15; // Closest orbit (for highest market cap)
    const maxRadius = Math.min(width, height) * 0.45; // Farthest orbit (for lowest market cap)

    if (maxMarketCap === minMarketCap) {
        // If all have the same market cap, place them in the middle orbit
        return (minRadius + maxRadius) / 2;
    }

    // Use inverse log scale: higher market cap -> smaller radius
    // Scale log(marketCap) to range [0, 1]
    const logMin = Math.log10(minMarketCap);
    const logMax = Math.log10(maxMarketCap);
    // Handle potential log(0) or negative caps, although filtered earlier
    const logCap = marketCap > 0 ? Math.log10(marketCap) : logMin;

    // Normalized log value [0, 1], clamped to handle edge cases
    let normalizedLog = 0;
    if (logMax > logMin) { // Avoid division by zero
        normalizedLog = Math.max(0, Math.min(1, (logCap - logMin) / (logMax - logMin)));
    }
    
    // Inverse map to radius: higher normalizedLog (higher cap) -> closer to minRadius
    const radius = maxRadius - normalizedLog * (maxRadius - minRadius);
    
    // Clamp radius within defined bounds
    return Math.max(minRadius, Math.min(maxRadius, radius));
  };

  // --- D3 Force Simulation Setup ---
  const simulation = d3.forceSimulation(nodes)
    // Keep nodes from overlapping - Increased padding
    .force("collision", d3.forceCollide().radius((d: NarrativeNode) => (d.radius || 20) + 10).strength(0.9))
    // General repulsion - Increased strength for more spacing
    .force("charge", d3.forceManyBody().strength(-100)) 
    // Custom radial force to position nodes in orbits
    .force("orbit", d3.forceRadial(
        (d: NarrativeNode) => calculateOrbitalRadius(d, nodes, centralNode), 
        width / 2, 
        height / 2
      ).strength(1)) // Strong strength to enforce the radius
    .alphaDecay(0.0228) // Default alpha decay
    .velocityDecay(0.4); // Default velocity decay

  // Fix the central node's position
  useEffect(() => {
      if (centralNode) {
          centralNode.fx = width / 2;
          centralNode.fy = height / 2;
      }
      // Restart simulation when central node, width, or height changes
      simulation.alpha(0.3).restart(); 
  }, [centralNode, width, height, simulation]);

  // Apply bounds to keep nodes within the SVG area
  const applyBounds = () => {
    nodes.forEach(node => {
      if (node === centralNode) return; // Don't bound the fixed central node
      const radius = node.radius || 20;
      // Ensure x and y are numbers before applying Math functions
      node.x = typeof node.x === 'number' ? Math.max(radius, Math.min(width - radius, node.x)) : width / 2;
      node.y = typeof node.y === 'number' ? Math.max(radius, Math.min(height - radius, node.y)) : height / 2;
    });
  };

  // Drag handlers
  const dragHandlers = {
    dragstarted: (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      // Store initial position before fixing
      event.subject.startX = event.subject.x;
      event.subject.startY = event.subject.y;
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    },
    dragged: (event: any) => {
      // Prevent dragging the central node
      if (event.subject === centralNode) return;
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    dragended: (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      // Keep central node fixed
      if (event.subject === centralNode) {
        event.subject.fx = width / 2;
        event.subject.fy = height / 2;
      } else {
        // Allow non-central nodes to be released (simulation takes over)
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  };

  return {
    simulation,
    applyBounds,
    dragHandlers,
    centralNode // Expose central node if needed elsewhere
  };
};

