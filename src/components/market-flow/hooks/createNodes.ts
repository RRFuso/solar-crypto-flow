
import { MarketIndex } from '@/types/indices';

export const createNodes = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  indices: MarketIndex[],
  centralIndex: MarketIndex,
  width: number,
  height: number
) => {
  // Create nodes for indices
  const nodes = indices.map(index => {
    const isCentral = index.id === centralIndex.id;
    return {
      id: index.id,
      name: index.name,
      value: index.value || 0,
      change: index.change || 0,
      changePercent: index.changePercent || index.change || 0,
      category: index.category || 'index',
      radius: isCentral ? 40 : 30, // Central node is larger
      color: index.color,
      x: 0,
      y: 0,
      isCentral
    };
  });
  
  // Position central node in the middle
  const centralNode = nodes.find(n => n.isCentral);
  if (centralNode) {
    centralNode.x = width / 2;
    centralNode.y = height / 2;
  }
  
  // Draw orbit circles
  const nonCentralNodes = nodes.filter(n => !n.isCentral)
    .sort((a, b) => b.value - a.value);
  
  const orbitLayers = Math.min(3, Math.ceil(nonCentralNodes.length / 6));
  const baseRadius = Math.min(width, height) * 0.3 / orbitLayers;
  
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
  
  // Position nodes with anti-collision logic
  const placedNodes: Array<{x: number, y: number, radius: number}> = [
    { x: width / 2, y: height / 2, radius: (centralNode?.radius || 40) * 1.2 }
  ];
  
  nonCentralNodes.forEach((node, i) => {
    // Determine orbit layer based on value
    const valueRatio = node.value / (centralNode?.value || 1);
    const layerIndex = Math.min(
      orbitLayers - 1, 
      Math.floor((1 - Math.min(valueRatio, 0.8)) * orbitLayers)
    );
    const orbitRadius = (layerIndex + 1) * baseRadius;
    
    // Find non-colliding position
    let angle = (i * 0.618033988749895) * Math.PI * 2;
    let found = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!found && attempts < maxAttempts) {
      const testX = width / 2 + Math.cos(angle) * orbitRadius;
      const testY = height / 2 + Math.sin(angle) * orbitRadius;
      
      // Check for collisions
      let collision = false;
      for (const placed of placedNodes) {
        const dx = testX - placed.x;
        const dy = testY - placed.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = placed.radius + node.radius * 1.2;
        
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
        angle += 0.5;
        attempts++;
      }
    }
    
    // Fallback position if needed
    if (!found) {
      const fallbackAngle = i * (Math.PI * 2 / nonCentralNodes.length);
      node.x = width / 2 + Math.cos(fallbackAngle) * orbitRadius;
      node.y = height / 2 + Math.sin(fallbackAngle) * orbitRadius;
    }
  });
  
  // Create gradient definitions for each node
  const defs = svg.append("defs");
  
  nodes.forEach(node => {
    // Normalize the change value to a range of -1 to 1
    // Assuming typical market changes are within -10% to +10%
    const normalizedChange = Math.min(Math.max(node.change / 10, -1), 1);
    
    // Create unique gradient ID for each node
    const gradientId = `gradient-${node.id}`;
    
    // Create linear gradient
    const gradient = defs.append("radialGradient")
      .attr("id", gradientId)
      .attr("cx", "0.5")
      .attr("cy", "0.5")
      .attr("r", "0.5")
      .attr("fx", "0.5")
      .attr("fy", "0.5");
    
    // Add gradient stops based on normalized change
    if (normalizedChange >= 0) {
      // Green gradient for positive change
      const intensity = Math.floor(normalizedChange * 255);
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", `rgba(0, ${intensity}, 0, 0.8)`);
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgba(0, 0, 0, 0.3)");
    } else {
      // Red gradient for negative change
      const intensity = Math.floor(-normalizedChange * 255);
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", `rgba(${intensity}, 0, 0, 0.8)`);
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgba(0, 0, 0, 0.3)");
    }
  });
  
  // Draw nodes (circles) with gradient backgrounds
  const nodeGroup = svg.append("g").attr("class", "nodes");
  
  // Add background circles with gradient fill
  nodeGroup.selectAll(".node-background")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "node-background")
    .attr("cx", d => d.x || 0)
    .attr("cy", d => d.y || 0)
    .attr("r", d => d.radius * 1.4)
    .attr("fill", d => `url(#gradient-${d.id})`)
    .attr("opacity", 0.9);
  
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
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2)
    .attr("opacity", 0.8);
  
  // Add text (index name)
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("fill", "white")
    .attr("font-weight", "bold")
    .attr("font-size", d => d.isCentral ? "14px" : "12px")
    .text(d => d.name);
  
  // Add percentage text
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.6em")
    .attr("fill", d => d.change >= 0 ? "#00ffcc" : "#ff0066")
    .attr("font-weight", "bold")
    .attr("font-size", "10px")
    .text(d => (d.change >= 0 ? "+" : "") + d.change + "%");
  
  // Add pulsating effect for central node
  if (centralNode) {
    const centralPulse = nodeGroup.append("circle")
      .attr("class", "central-pulse")
      .attr("cx", centralNode.x)
      .attr("cy", centralNode.y)
      .attr("r", centralNode.radius * 1.2)
      .attr("fill", "none")
      .attr("stroke", "#F7931A")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);
      
    // Add animation for central node pulse
    centralPulse
      .transition()
      .duration(2000)
      .attr("r", centralNode.radius * 1.6)
      .attr("stroke-opacity", 0.1)
      .transition()
      .duration(2000)
      .attr("r", centralNode.radius * 1.2)
      .attr("stroke-opacity", 0.5)
      .on("end", function repeat() {
        d3.select(this)
          .transition()
          .duration(2000)
          .attr("r", centralNode.radius * 1.6)
          .attr("stroke-opacity", 0.1)
          .transition()
          .duration(2000)
          .attr("r", centralNode.radius * 1.2)
          .attr("stroke-opacity", 0.5)
          .on("end", repeat);
      });
  }
  
  return nodes;
};
