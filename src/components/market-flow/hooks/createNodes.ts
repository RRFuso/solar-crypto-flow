
export const createNodes = (
  svg: any,
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
  
  // Draw orbit circles using native DOM methods
  const nonCentralNodes = nodes.filter(n => !n.isCentral)
    .sort((a, b) => b.value - a.value);
  
  const orbitLayers = Math.min(3, Math.ceil(nonCentralNodes.length / 6));
  const baseRadius = Math.min(width, height) * 0.3 / orbitLayers;
  
  for (let i = 1; i <= orbitLayers; i++) {
    const orbitRadius = i * baseRadius;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", (width / 2).toString());
    circle.setAttribute("cy", (height / 2).toString());
    circle.setAttribute("r", orbitRadius.toString());
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
    circle.setAttribute("stroke-width", "1");
    circle.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(circle);
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
  
  // Create gradient definitions for each node using native DOM methods
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);
  
  nodes.forEach(node => {
    // Normalize the change value to a range of -1 to 1
    const normalizedChange = Math.min(Math.max(node.change / 10, -1), 1);
    
    // Create unique gradient ID for each node
    const gradientId = `gradient-${node.id}`;
    
    // Create radial gradient
    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("cx", "0.5");
    gradient.setAttribute("cy", "0.5");
    gradient.setAttribute("r", "0.5");
    gradient.setAttribute("fx", "0.5");
    gradient.setAttribute("fy", "0.5");
    
    // Add gradient stops based on normalized change
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    
    if (normalizedChange >= 0) {
      // Green gradient for positive change
      const intensity = Math.floor(normalizedChange * 255);
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", `rgba(0, ${intensity}, 0, 0.8)`);
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "rgba(0, 0, 0, 0.3)");
    } else {
      // Red gradient for negative change
      const intensity = Math.floor(-normalizedChange * 255);
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", `rgba(${intensity}, 0, 0, 0.8)`);
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "rgba(0, 0, 0, 0.3)");
    }
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
  });
  
  // Draw nodes (circles) with gradient backgrounds
  const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nodeGroup.setAttribute("class", "nodes");
  svg.appendChild(nodeGroup);
  
  // Add background circles with gradient fill
  nodes.forEach(node => {
    const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgCircle.setAttribute("class", "node-background");
    bgCircle.setAttribute("cx", (node.x || 0).toString());
    bgCircle.setAttribute("cy", (node.y || 0).toString());
    bgCircle.setAttribute("r", (node.radius * 1.4).toString());
    bgCircle.setAttribute("fill", `url(#gradient-${node.id})`);
    bgCircle.setAttribute("opacity", "0.9");
    nodeGroup.appendChild(bgCircle);
  });
  
  const nodeElements: SVGGElement[] = [];
  
  nodes.forEach(node => {
    const nodeElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeElement.setAttribute("class", "node");
    nodeElement.setAttribute("transform", `translate(${node.x || 0},${node.y || 0})`);
    
    // Add circles with index colors
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", node.radius.toString());
    circle.setAttribute("fill", node.color);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("opacity", "0.8");
    nodeElement.appendChild(circle);
    
    // Add text (index name)
    const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nameText.setAttribute("text-anchor", "middle");
    nameText.setAttribute("dy", ".3em");
    nameText.setAttribute("fill", "white");
    nameText.setAttribute("font-weight", "bold");
    nameText.setAttribute("font-size", node.isCentral ? "14px" : "12px");
    nameText.textContent = node.name;
    nodeElement.appendChild(nameText);
    
    // Add percentage text
    const percentText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    percentText.setAttribute("text-anchor", "middle");
    percentText.setAttribute("dy", "1.6em");
    percentText.setAttribute("fill", node.change >= 0 ? "#00ffcc" : "#ff0066");
    percentText.setAttribute("font-weight", "bold");
    percentText.setAttribute("font-size", "10px");
    percentText.textContent = (node.change >= 0 ? "+" : "") + node.change + "%";
    nodeElement.appendChild(percentText);
    
    nodeGroup.appendChild(nodeElement);
    nodeElements.push(nodeElement);
  });
  
  // Add pulsating effect for central node
  if (centralNode) {
    const centralPulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralPulse.setAttribute("class", "central-pulse");
    centralPulse.setAttribute("cx", centralNode.x.toString());
    centralPulse.setAttribute("cy", centralNode.y.toString());
    centralPulse.setAttribute("r", (centralNode.radius * 1.2).toString());
    centralPulse.setAttribute("fill", "none");
    centralPulse.setAttribute("stroke", "#F7931A");
    centralPulse.setAttribute("stroke-width", "2");
    centralPulse.setAttribute("stroke-opacity", "0.5");
    
    // Add CSS animation for central node pulse
    const style = document.createElement("style");
    style.textContent = `
      .central-pulse {
        animation: centralPulse 4s ease-in-out infinite;
      }
      @keyframes centralPulse {
        0%, 100% { 
          r: ${centralNode.radius * 1.2}px; 
          stroke-opacity: 0.5; 
        }
        50% { 
          r: ${centralNode.radius * 1.6}px; 
          stroke-opacity: 0.1; 
        }
      }
    `;
    document.head.appendChild(style);
    
    nodeGroup.appendChild(centralPulse);
  }
  
  return nodes;
};
