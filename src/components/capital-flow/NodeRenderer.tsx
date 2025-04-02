
import React, { useEffect } from 'react';
import * as d3 from 'd3';

type OrbitalNode = {
  id: string;
  marketCap: number;
  radius: number;
  type: "central" | "orbital";
  x: number;
  y: number;
};

interface NodeRendererProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  centralNode: OrbitalNode;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({ svg, nodes, centralNode }) => {
  useEffect(() => {
    // Draw nodes with glowing effect
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    // Add glowing effect around nodes
    nodeGroup.selectAll(".node-glow")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node-glow")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.radius * 1.3)
      .attr("fill", d => d.type === "central" ? "#3182ce" : "#00b5d8")
      .attr("opacity", 0.2)
      .attr("filter", "blur(8px)");
    
    // Draw node circles
    const node = nodeGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.type === "central" ? "#3182ce" : "#00b5d8")
      .attr("stroke", "#ffffff") // White border
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);
    
    // Add text labels (always white)
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.type === "central" ? "14px" : "12px")
      .text(d => d.id);
    
    // Add pulsating animation to central node
    if (centralNode) {
      const centralNodeElement = node.filter(d => d.type === "central")
        .select("circle");
        
      function createPulse() {
        centralNodeElement.transition()
          .duration(1500)
          .attr("r", centralNode.radius * 1.05)
          .transition()
          .duration(1500)
          .attr("r", centralNode.radius)
          .on("end", createPulse);
      }
      
      createPulse();
    }
    
    return () => {
      // Clean up any D3 animations
      svg.selectAll(".node").selectAll("*").interrupt();
    };
  }, [svg, nodes, centralNode]);
  
  return null;
};
