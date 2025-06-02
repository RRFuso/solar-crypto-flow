import { RefObject, useEffect } from 'react';
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';

interface SimulationConfig {
  nodes: NarrativeNode[];
  width: number;
  height: number;
}

export const useSimulation = ({ nodes, width, height }: SimulationConfig) => {
  // Create a simulation that will position nodes
  const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-300))
    .force("collision", d3.forceCollide().radius(d => d.radius + 25))
    .alphaDecay(0.05)
    .velocityDecay(0.6);

  // Find BTC-related narrative or the largest node
  const findCentralNode = () => {
    if (nodes.length === 0) return null;
    
    // Try to find a Bitcoin narrative
    const btcNarrative = nodes.find(node => 
      node.name.toLowerCase().includes("bitcoin") || 
      node.tokens.includes("BTC")
    );
    
    // If no Bitcoin narrative, use the largest node by market cap
    if (!btcNarrative) {
      return nodes.reduce((max, node) => 
        node.value > max.value ? node : max, 
        nodes[0]
      );
    }
    
    return btcNarrative;
  };

  // Position nodes in a radial layout with central node
  const positionNodes = () => {
    if (nodes.length === 0) return;
    
    const centralNode = findCentralNode();
    if (!centralNode) return;
    
    // Set central node position
    centralNode.x = width / 2;
    centralNode.y = height / 2;
    centralNode.fx = width / 2;
    centralNode.fy = height / 2;
    
    // Setup radial force for other nodes
    simulation
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("radial", d3.forceRadial(
        node => node === centralNode ? 0 : width * 0.3,
        width / 2,
        height / 2
      ).strength(0.8));
    
    // Distribute other nodes evenly in a circle
    const otherNodes = nodes.filter(node => node !== centralNode);
    const angleStep = (2 * Math.PI) / otherNodes.length;
    
    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      const radius = width * 0.3;
      
      node.x = width/2 + Math.cos(angle) * radius;
      node.y = height/2 + Math.sin(angle) * radius;
    });
  };

  // Keep nodes within bounds during simulation
  const applyBounds = () => {
    const centralNode = findCentralNode();
    
    nodes.forEach(node => {
      // Don't constrain the central node
      if (node === centralNode) return;
      
      const padding = node.radius || 40;
      
      // Keep within bounds
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
      
      // Ensure minimum distance from central node to prevent overlap
      if (centralNode) {
        const dx = node.x - centralNode.x;
        const dy = node.y - centralNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = centralNode.radius + node.radius + 30;
        
        if (distance < minDistance) {
          // Move node away from central node
          const angle = Math.atan2(dy, dx);
          node.x = centralNode.x + Math.cos(angle) * minDistance;
          node.y = centralNode.y + Math.sin(angle) * minDistance;
        }
      }
    });
  };

  // Drag handlers for nodes
  const dragHandlers = {
    dragstarted: (event: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    },
    dragged: (event: any) => {
      // Don't allow dragging the central node
      const centralNode = findCentralNode();
      if (event.subject === centralNode) return;
      
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    dragended: (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      
      // Keep central node fixed, allow others to move
      const centralNode = findCentralNode();
      if (event.subject === centralNode) {
        event.subject.fx = width / 2;
        event.subject.fy = height / 2;
      } else {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  };

  return {
    simulation,
    positionNodes,
    applyBounds,
    dragHandlers
  };
};
