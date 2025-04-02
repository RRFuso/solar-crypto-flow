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
      
      // Compute total volume per asset to determine market cap if not provided
      const assetVolumes = new Map<string, number>();
      
      data.forEach(flow => {
        // Sum volumes for both source and target nodes
        const fromVolume = assetVolumes.get(flow.from) || 0;
        assetVolumes.set(flow.from, fromVolume + (flow.volume || 0));
        
        const toVolume = assetVolumes.get(flow.to) || 0;
        assetVolumes.set(flow.to, toVolume + (flow.volume || 0));
      });
      
      // Create nodes with market cap (or volume) information
      const nodes = assets.map(id => {
        // Use marketCap if available in data, otherwise use the computed volume
        const marketCap = data.find(d => d.from === id || d.to === id)?.marketCap || 
                          assetVolumes.get(id) || 1;
        
        const isBTC = id === 'BTC';
        
        return {
          id,
          marketCap,
          radius: isBTC ? 45 : Math.max(20, Math.min(40, 20 + (marketCap / 1000))),
          type: isBTC ? "central" : "orbital",
          x: 0,
          y: 0
        };
      });
      
      // Find the node with the highest market cap to serve as the central node
      const centralNode = nodes.reduce((max, node) => 
        node.marketCap > max.marketCap ? node : max, 
        { ...nodes[0], marketCap: -Infinity });
      
      // Mark the central node
      centralNode.type = "central";
      centralNode.radius = 45; // Make central node bigger
      
      // Create links
      const links = data.map(flow => ({
        source: nodes.find(n => n.id === flow.from),
        target: nodes.find(n => n.id === flow.to),
        value: flow.value,
        volume: flow.volume,
        percentage: flow.percentage
      })).filter(link => link.source && link.target);
      
      // Position nodes in improved planetary layout
      // First, sort other nodes by market cap in descending order
      const nonCentralNodes = nodes
        .filter(n => n.id !== centralNode.id)
        .sort((a, b) => b.marketCap - a.marketCap);
      
      // Calculate orbit layers based on market cap
      // Use more orbit layers to reduce overlap
      const orbitLayers = Math.min(8, Math.ceil(nonCentralNodes.length / 4));
      const baseRadius = Math.min(width, height) * 0.4 / orbitLayers;
      
      // Position central node in the middle
      centralNode.x = width / 2;
      centralNode.y = height / 2;
      
      // Draw orbit circles
      for (let i = 1; i <= orbitLayers; i++) {
        const orbitRadius = i * baseRadius;
        svgSelection.append("circle")
          .attr("cx", width / 2)
          .attr("cy", height / 2)
          .attr("r", orbitRadius)
          .attr("fill", "none")
          .attr("stroke", "rgba(255, 255, 255, 0.1)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");
      }
      
      // Position other nodes in orbits based on market cap
      // with improved anti-collision logic
      const placedNodes: Array<{x: number, y: number, radius: number}> = [
        { x: centralNode.x, y: centralNode.y, radius: centralNode.radius * 1.5 } // Increase padding for central node
      ];
      
      nonCentralNodes.forEach((node, i) => {
        // Determine which orbit layer this node belongs to based on market cap ratio
        const marketCapRatio = node.marketCap / centralNode.marketCap;
        const layerIndex = Math.min(
          orbitLayers - 1, 
          Math.floor((1 - Math.min(marketCapRatio, 0.8)) * orbitLayers)
        );
        
        // Calculate orbit radius with added spacing between orbits
        const orbitRadius = (layerIndex + 1) * baseRadius * 1.2; // Add 20% more spacing
        
        // Try to find a position that doesn't overlap with existing nodes
        let angle = (i * 0.618033988749895) * Math.PI * 2; // Golden angle for better distribution
        let found = false;
        let attempts = 0;
        const maxAttempts = 100; // Increase max attempts
        
        // Calculate optimal angular spacing for this orbit
        const nodesInThisOrbit = nonCentralNodes.filter(n => {
          const nodeRatio = n.marketCap / centralNode.marketCap;
          const nodeLayer = Math.min(
            orbitLayers - 1, 
            Math.floor((1 - Math.min(nodeRatio, 0.8)) * orbitLayers)
          );
          return nodeLayer === layerIndex;
        }).length;
        
        const optimalAngleStep = (2 * Math.PI) / Math.max(1, nodesInThisOrbit);
        
        while (!found && attempts < maxAttempts) {
          // Use a combination of golden angle and optimal spacing based on attempt number
          if (attempts < 20) {
            angle = (i * optimalAngleStep) + (attempts * 0.1);
          } else {
            angle = Math.random() * 2 * Math.PI; // After initial attempts, try random placement
          }
          
          const testX = width / 2 + Math.cos(angle) * orbitRadius;
          const testY = height / 2 + Math.sin(angle) * orbitRadius;
          
          // Check for collisions with existing nodes with increased safety margins
          let collision = false;
          for (const placed of placedNodes) {
            const dx = testX - placed.x;
            const dy = testY - placed.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = placed.radius + node.radius * 1.5; // Increase minimum distance
            
            if (distance < minDistance) {
              collision = true;
              break;
            }
          }
          
          if (!collision) {
            node.x = testX;
            node.y = testY;
            placedNodes.push({ x: testX, y: testY, radius: node.radius * 1.5 });
            found = true;
          } else {
            attempts++;
          }
        }
        
        // If we couldn't find a non-colliding position, use a fallback method
        // Place it at a safe distance, even if not exactly on the ideal orbit
        if (!found) {
          const fallbackAngle = i * (Math.PI * 2 / nonCentralNodes.length);
          let safeRadius = orbitRadius;
          let safeX, safeY;
          
          // Find a safe radius by incrementally increasing it
          let safeFound = false;
          while (!safeFound && safeRadius < Math.min(width, height)) {
            safeX = width / 2 + Math.cos(fallbackAngle) * safeRadius;
            safeY = height / 2 + Math.sin(fallbackAngle) * safeRadius;
            
            // Check for collisions
            safeFound = true;
            for (const placed of placedNodes) {
              const dx = safeX - placed.x;
              const dy = safeY - placed.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = placed.radius + node.radius * 1.5;
              
              if (distance < minDistance) {
                safeFound = false;
                break;
              }
            }
            
            if (!safeFound) {
              safeRadius += 15; // Increment by larger amount to find space faster
            }
          }
          
          node.x = safeX || width / 2 + Math.cos(fallbackAngle) * orbitRadius;
          node.y = safeY || height / 2 + Math.sin(fallbackAngle) * orbitRadius;
          placedNodes.push({ 
            x: node.x, 
            y: node.y, 
            radius: node.radius * 1.5 
          });
        }
      });
      
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
          .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e");
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
          .attr("fill", link.percentage > 0 ? "#4ade80" : "#f43f5e")
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
            
            // Reverse direction for outflows
            if (link.percentage <= 0) {
              offset = pathLength - offset;
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
          
        centralNodeElement.append("animate")
          .attr("attributeName", "r")
          .attr("values", `${centralNode.radius};${centralNode.radius * 1.05};${centralNode.radius}`)
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
      }
      
      // Add subtle orbital rotation (slow for realism)
      const rotationSpeed = 0.00005; // Very slow rotation
      
      function animateOrbits() {
        nonCentralNodes.forEach((node) => {
          // Calculate current angle from center
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
        return requestAnimationFrame(animateOrbits);
      }
      
      // Start animation
      const animationFrameId = requestAnimationFrame(animateOrbits);
      
      // Cleanup on unmount will be handled by the returned function
      return animationFrameId;
    };
    
    // Use our modified visualization function
    const animationFrameId = customVisualization(flowData, svgRef.current, containerRef.current);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [flowData, createVisualization]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
