
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IndexRotationResult } from '@/types/indices';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface MarketFlowVisualizationProps {
  data: IndexRotationResult;
}

export const MarketFlowVisualization: React.FC<MarketFlowVisualizationProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();
    
    const width = containerRef.current.clientWidth;
    const height = 350;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");
    
    // Find central index (using SPY or S&P 500)
    const centralIndex = data.indices.find(idx => 
      idx.id === 'SPY' || idx.symbol === 'SPX' || idx.name.includes('S&P')
    ) || data.indices[0];
    
    // Create nodes for indices
    const nodes = data.indices.map(index => {
      const isCentral = index.id === centralIndex.id;
      return {
        id: index.id,
        name: index.name,
        value: index.value || 0,
        change: index.change || 0,
        radius: isCentral ? 40 : 30, // Central node is larger
        color: index.color,
        x: 0,
        y: 0,
        isCentral
      };
    });
    
    // Create links from flows
    const links = data.flows.map(flow => ({
      source: nodes.find(n => n.id === flow.from),
      target: nodes.find(n => n.id === flow.to),
      value: flow.value,
      percentage: flow.percentage
    })).filter(link => link.source && link.target);
    
    // Position nodes in planetary layout
    // First, sort other nodes by market cap (value) in descending order
    const nonCentralNodes = nodes
      .filter(n => !n.isCentral)
      .sort((a, b) => b.value - a.value);
    
    // Calculate orbit layers based on market cap
    const orbitLayers = Math.min(3, Math.ceil(nonCentralNodes.length / 6));
    const baseRadius = Math.min(width, height) * 0.3 / orbitLayers;
    
    // Position central node in the middle
    const centralNode = nodes.find(n => n.isCentral);
    if (centralNode) {
      centralNode.x = width / 2;
      centralNode.y = height / 2;
    }
    
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      const orbitRadius = i * baseRadius;
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.1)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "5,5");
    }
    
    // Position other nodes in orbits based on market cap
    // with anti-collision logic
    const placedNodes: Array<{x: number, y: number, radius: number}> = [
      { x: width / 2, y: height / 2, radius: (centralNode?.radius || 40) * 1.2 }
    ];
    
    nonCentralNodes.forEach((node, i) => {
      // Determine which orbit layer this node belongs to
      // Higher values get closer orbits
      const valueRatio = node.value / (centralNode?.value || 1);
      const layerIndex = Math.min(
        orbitLayers - 1, 
        Math.floor((1 - Math.min(valueRatio, 0.8)) * orbitLayers)
      );
      const orbitRadius = (layerIndex + 1) * baseRadius;
      
      // Try to find a position that doesn't overlap with existing nodes
      let angle = (i * 0.618033988749895) * Math.PI * 2; // Golden angle for better distribution
      let found = false;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!found && attempts < maxAttempts) {
        const testX = width / 2 + Math.cos(angle) * orbitRadius;
        const testY = height / 2 + Math.sin(angle) * orbitRadius;
        
        // Check for collisions with existing nodes
        let collision = false;
        for (const placed of placedNodes) {
          const dx = testX - placed.x;
          const dy = testY - placed.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = placed.radius + node.radius * 1.2; // Add some padding
          
          if (distance < minDistance) {
            collision = true;
            break;
          }
        }
        
        if (!collision) {
          node.x = testX;
          node.y = testY;
          placedNodes.push({ x: testX, y: testY, radius: node.radius * 1.2 });
          found = true;
        } else {
          angle += 0.5; // Try another angle
          attempts++;
        }
      }
      
      // If we couldn't find a non-colliding position, place it anyway
      if (!found) {
        const fallbackAngle = i * (Math.PI * 2 / nonCentralNodes.length);
        node.x = width / 2 + Math.cos(fallbackAngle) * orbitRadius;
        node.y = height / 2 + Math.sin(fallbackAngle) * orbitRadius;
      }
    });
    
    // Draw links with flow animation
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("stroke-width", d => 2 + (Math.abs(d.value) / 10) * 6)
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10")
      .attr("opacity", 0.7)
      .attr("d", (d: any) => {
        // Create curved paths between nodes
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
      });
    
    // Create markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(links)
      .enter().append("marker")
      .attr("id", (d, i) => `arrow-${i}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d.percentage > 0 ? "#00ffcc" : "#ff0066")
      .attr("d", "M0,-5L10,0L0,5");
    
    link.attr("marker-end", (d, i) => `url(#arrow-${i})`);
    
    // Add animated flow particles
    links.forEach((d, i) => {
      // Create particle group for this link
      const particles = svg.append("g")
        .attr("class", "flow-particles")
        .selectAll("circle")
        .data(d3.range(5)) // 5 particles per link
        .enter()
        .append("circle")
        .attr("r", 2)
        .attr("fill", d.percentage > 0 ? "#00ffcc" : "#ff0066")
        .attr("opacity", 0.8);
      
      // Animate particles along the path
      function animateParticles() {
        const path = link.nodes()[i];
        if (!path) return;
        
        const pathLength = path.getTotalLength();
        
        particles
          .attr("transform", function(d: any, j: number) {
            // Stagger the particles
            let offset = (j / 5) * pathLength;
            
            // Add time-based offset that loops
            offset += (Date.now() / 50) % pathLength;
            if (d.percentage !== undefined && d.percentage <= 0) { 
              offset = pathLength - offset; // Reverse direction for outflows
            }
            
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
    
    // Draw nodes (circles) with glowing effect
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    // Add glowing effect for planets
    nodeGroup.selectAll(".glow")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "glow")
      .attr("cx", d => d.x || 0)
      .attr("cy", d => d.y || 0)
      .attr("r", d => d.radius * 1.4)
      .attr("fill", d => d.color)
      .attr("opacity", 0.2)
      .attr("filter", "blur(8px)");
    
    const node = nodeGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    
    // Add circles with index colors
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", "#ffffff") // White border
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);
    
    // Add text (index name) - always white
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => d.isCentral ? "14px" : "12px")
      .text(d => d.name);
    
    // Add percentage text - keep the color for positive/negative indication
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.6em")
      .attr("fill", d => d.change >= 0 ? "#00ffcc" : "#ff0066")
      .attr("font-weight", "bold")
      .attr("font-size", "10px")
      .text(d => (d.change >= 0 ? "+" : "") + d.change + "%");
    
    // Add pulsating effect for planetary look
    node.selectAll("circle")
      .each(function(d: any) {
        if (!d.isCentral) return; // Only add animation to central node
        
        d3.select(this)
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", `${d.radius};${d.radius * 1.05};${d.radius}`)
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
      });
    
    // Add subtle orbital rotation animation
    const rotationSpeed = 0.00005; // Slow rotation for more realistic planetary movement
    
    function animateOrbits() {
      nodes.forEach((node, i) => {
        if (node.isCentral) return; // Skip central node
        
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
        .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
      
      // Update glow positions
      nodeGroup.selectAll(".glow")
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);
      
      // Update link positions
      link.attr("d", (d: any) => {
        const dx = (d.target.x || 0) - (d.source.x || 0);
        const dy = (d.target.y || 0) - (d.source.y || 0);
        const dr = Math.sqrt(dx * dx + dy * dy) * 2;
        return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`;
      });
      
      // Continue animation
      return requestAnimationFrame(animateOrbits);
    }
    
    // Start animation
    const animationFrameId = animateOrbits();
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    
  }, [data]);
  
  return (
    <div ref={containerRef} className="w-full flex-1">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
