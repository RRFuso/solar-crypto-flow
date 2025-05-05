
import * as d3 from 'd3';

export const createNodes = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  indices: any[],
  centralIndex: any,
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
  node.selectAll("circle")
    .each(function(d: any) {
      if (!d.isCentral) return;
      
      d3.select(this)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", `${d.radius};${d.radius * 1.05};${d.radius}`)
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");
    });
  
  return nodes;
};
