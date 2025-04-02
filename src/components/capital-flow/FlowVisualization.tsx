
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FlowData } from '@/types/crypto';
import { useCapitalFlowVisualization } from '@/hooks/capital-flow/useCapitalFlowVisualization';

interface FlowVisualizationProps {
  flowData: FlowData[];
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({ flowData }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createVisualization } = useCapitalFlowVisualization();

  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Update createVisualization to use orbital style
    const customVisualization = (data: FlowData[], svg: SVGSVGElement, container: HTMLDivElement) => {
      // Get width and height
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Create D3 selection
      const svgSelection = d3.select(svg)
        .attr("width", width)
        .attr("height", height);
      
      // Extract unique assets for nodes
      const assets = Array.from(new Set([
        ...data.map(d => d.from),
        ...data.map(d => d.to)
      ]));
      
      // Create nodes
      const nodes = assets.map(id => ({
        id,
        radius: 30,
        type: id.includes("BTC") ? "central" : "orbital",
        x: 0,
        y: 0
      }));
      
      // Create links
      const links = data.map(flow => ({
        source: nodes.find(n => n.id === flow.from),
        target: nodes.find(n => n.id === flow.to),
        value: flow.value,
        volume: flow.volume
      })).filter(link => link.source && link.target);
      
      // Find central node (BTC or highest volume)
      const centralNode = nodes.find(n => n.type === "central") || 
        nodes.reduce((max, node) => {
          const nodeVolume = data
            .filter(d => d.from === node.id || d.to === node.id)
            .reduce((sum, d) => sum + d.volume, 0);
          
          const maxVolume = data
            .filter(d => d.from === max.id || d.to === max.id)
            .reduce((sum, d) => sum + d.volume, 0);
          
          return nodeVolume > maxVolume ? node : max;
        }, nodes[0]);
      
      if (centralNode) {
        centralNode.type = "central";
        centralNode.radius = 45; // Make central node bigger
      }
      
      // Position nodes in orbital layout
      const nonCentralNodes = nodes.filter(n => n.id !== centralNode.id);
      const orbitRadius = Math.min(width, height) * 0.3;
      
      // Position central node in the middle
      if (centralNode) {
        centralNode.x = width / 2;
        centralNode.y = height / 2;
      }
      
      // Position other nodes in orbit
      nonCentralNodes.forEach((node, i) => {
        const angle = (i / nonCentralNodes.length) * Math.PI * 2;
        node.x = width / 2 + Math.cos(angle) * orbitRadius;
        node.y = height / 2 + Math.sin(angle) * orbitRadius;
      });
      
      // Draw orbit circle
      svgSelection.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
      
      // Draw links with gradient
      const linkGroup = svgSelection.append("g").attr("class", "links");
      
      // Create gradients for links
      const defs = svgSelection.append("defs");
      
      links.forEach((link, i) => {
        const id = `link-gradient-${i}`;
        const gradient = defs.append("linearGradient")
          .attr("id", id)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", link.source.x)
          .attr("y1", link.source.y)
          .attr("x2", link.target.x)
          .attr("y2", link.target.y);
          
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#3182ce");
          
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#00b5d8");
        
        // Create arrow markers
        defs.append("marker")
          .attr("id", `arrow-${i}`)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 25)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", link.value > 0 ? "#4ade80" : "#f43f5e");
      });
      
      // Draw link paths
      linkGroup.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
          return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        })
        .attr("stroke", (d, i) => `url(#link-gradient-${i})`)
        .attr("stroke-width", d => 2 + Math.min(5, Math.abs(d.value) / 10) * 2)
        .attr("fill", "none")
        .attr("stroke-dasharray", "10,10")
        .attr("opacity", 0.7)
        .attr("marker-end", (d, i) => `url(#arrow-${i})`);
      
      // Add flow particles animation
      links.forEach((link, i) => {
        const particles = svgSelection.append("g")
          .attr("class", "flow-particles")
          .selectAll("circle")
          .data(d3.range(5)) // 5 particles per link
          .enter()
          .append("circle")
          .attr("r", 2)
          .attr("fill", link.value > 0 ? "#4ade80" : "#f43f5e")
          .attr("opacity", 0.8);
        
        function animateParticles() {
          const path = linkGroup.selectAll("path").nodes()[i];
          if (!path) return;
          
          const pathLength = path.getTotalLength();
          
          particles.attr("transform", function(d, j) {
            // Stagger the particles
            let offset = (j / 5) * pathLength;
            
            // Add time-based offset that loops
            offset += (Date.now() / 50) % pathLength;
            
            // Loop back to start when reaching the end
            offset = offset % pathLength;
            
            // Get point along the path
            const point = path.getPointAtLength(offset);
            return `translate(${point.x}, ${point.y})`;
          });
          
          requestAnimationFrame(animateParticles);
        }
        
        animateParticles();
      });
      
      // Draw nodes with glowing effect
      const nodeGroup = svgSelection.append("g").attr("class", "nodes");
      
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
      
      // Add text labels (now white)
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".3em")
        .attr("fill", "white") // Changed to white
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .text(d => d.id);
      
      // Add pulsating animation to central node
      if (centralNode) {
        const centralNodeElement = node.filter(d => d.type === "central")
          .select("circle");
          
        centralNodeElement.append("animate")
          .attr("attributeName", "r")
          .attr("values", `${centralNode.radius};${centralNode.radius * 1.05};${centralNode.radius}`)
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
      }
      
      // Add subtle orbital rotation
      const rotationSpeed = 0.0001; // Very slow rotation
      
      function animateOrbits() {
        nonCentralNodes.forEach((node, i) => {
          // Calculate current angle and radius
          const dx = node.x - width/2;
          const dy = node.y - height/2;
          const angle = Math.atan2(dy, dx) + rotationSpeed;
          const radius = Math.sqrt(dx*dx + dy*dy);
          
          // Update position with rotation
          node.x = width/2 + Math.cos(angle) * radius;
          node.y = height/2 + Math.sin(angle) * radius;
        });
        
        // Update node positions
        nodeGroup.selectAll(".node")
          .attr("transform", d => `translate(${d.x},${d.y})`);
        
        // Update glow positions
        nodeGroup.selectAll(".node-glow")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
        
        // Update link positions
        linkGroup.selectAll("path")
          .attr("d", d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
            return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          });
        
        // Continue animation
        requestAnimationFrame(animateOrbits);
      }
      
      // Start animation
      animateOrbits();
    };
    
    // Use our modified visualization function
    customVisualization(flowData, svgRef.current, containerRef.current);
    
    return () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, createVisualization]);

  return (
    <div ref={containerRef} className="w-full flex-1">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
