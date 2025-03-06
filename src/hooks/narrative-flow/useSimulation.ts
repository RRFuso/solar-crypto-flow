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
    .force("charge", d3.forceManyBody().strength(-200))
    .force("collision", d3.forceCollide().radius(d => d.radius + 20))
    .alphaDecay(0.05)
    .velocityDecay(0.6);

  // Position the largest node on the left, others distributed on the right
  const positionNodes = () => {
    if (nodes.length === 0) return;
    
    // Sort nodes by market cap (descending)
    nodes.sort((a, b) => b.value - a.value);
    
    const largestNode = nodes[0];
    const otherNodes = nodes.slice(1);
    
    // Set largest node position on the left
    largestNode.x = width * 0.25;
    largestNode.y = height / 2;
    largestNode.fx = largestNode.x; // Fix position
    largestNode.fy = largestNode.y;
    
    // Distribute other nodes on the right side
    const rightSideWidth = width * 0.5;
    const rightSideStartX = width * 0.5;
    const rows = Math.ceil(Math.sqrt(otherNodes.length));
    const cols = Math.ceil(otherNodes.length / rows);
    
    otherNodes.forEach((node, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      node.x = rightSideStartX + (col * rightSideWidth / cols);
      node.y = (row + 0.5) * (height / rows);
    });
  };

  // Keep nodes within bounds during simulation
  const applyBounds = () => {
    nodes.forEach(d => {
      const padding = d.radius || 40;
      // Only adjust y bounds to maintain left-right positioning
      d.y = Math.max(padding, Math.min(height - padding, d.y));
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
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    },
    dragended: (event: any) => {
      if (!event.active) simulation.alphaTarget(0);
      
      // Don't release the largest node
      if (event.subject !== nodes[0]) {
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
