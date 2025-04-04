
import { RefObject } from 'react';
import * as d3 from 'd3';
import { NarrativeFlow, NarrativeNode } from '@/types/narratives';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

interface DrawOptions {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: NarrativeNode[];
  links: any[];
  isPredicted: boolean;
  dragHandlers: any;
}

export const useFlowVisualization = () => {
  // Create visual elements for the flow visualization
  const drawVisualization = (options: DrawOptions) => {
    const { svg, nodes, links, isPredicted, dragHandlers } = options;
    
    // Create defs for glows and clip paths
    const defs = svg.append("defs");
    
    // Create glow filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    
    // Add orbital paths for solar system effect
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Find the central node (Bitcoin or largest)
    const centralNode = nodes.find(n => n.name.toLowerCase().includes("bitcoin")) || 
                        nodes.reduce((max, n) => n.value > max.value ? n : max, nodes[0]);
    
    if (centralNode) {
      // Draw orbital circles
      const orbitGroup = svg.append("g").attr("class", "orbit-paths");
      const nonCentralNodes = nodes.filter(n => n !== centralNode);
      
      // Calculate distance from central node for each other node
      nonCentralNodes.forEach(node => {
        // Calculate distance
        const dx = node.x - centralNode.x;
        const dy = node.y - centralNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Draw orbit circle
        orbitGroup.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", distance)
          .attr("fill", "none")
          .attr("stroke", "rgba(255, 255, 255, 0.1)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");
      });
    }
    
    // Draw links with curved paths
    const linkGroup = svg.append("g").attr("class", "links");
    
    const link = linkGroup.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", d => isPredicted ? "#00ffaa" : "#ff00aa")
      .attr("stroke-width", d => {
        const maxFlow = d3.max(links, l => l.value) || 1;
        return 2 + (d.value / maxFlow) * 8;
      })
      .attr("fill", "none")
      .attr("stroke-dasharray", "10,10") // Dashed lines
      .attr("opacity", 0.7);

    // Add animated particles for flow visualization
    links.forEach((link, i) => {
      const particles = 3;
      for (let j = 0; j < particles; j++) {
        const particle = svg.append("circle")
          .attr("r", 3)
          .attr("fill", isPredicted ? "#00ffaa" : "#ff00aa")
          .attr("class", "flow-particle")
          .attr("opacity", 0.8)
          .attr("data-link-index", i)
          .attr("data-particle-index", j);
      }
    });

    // Add nodes
    const nodeGroup = svg.append("g").attr("class", "nodes");
    
    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("data-id", d => d.id)
      .call(d3.drag()
        .on("start", dragHandlers.dragstarted)
        .on("drag", dragHandlers.dragged)
        .on("end", dragHandlers.dragended));

    // Add glowing effect around nodes (planetary look)
    node.append("circle")
      .attr("class", "node-glow")
      .attr("r", d => d.radius * 1.5)
      .attr("fill", d => d.color)
      .attr("opacity", 0.3)
      .attr("filter", "url(#glow)");
      
    // Add node circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .attr("stroke", d => d.attentionScore && d.attentionScore > 50 ? "#ffffff" : "rgba(255,255,255,0.5)")
      .attr("stroke-width", d => d.attentionScore && d.attentionScore > 50 ? 3 : 2)
      .attr("opacity", 0.7)
      .attr("filter", "url(#glow)");
      
    // Add attention indicator pulse for high attention narratives
    node.filter(d => d.attentionScore && d.attentionScore > 70)
      .append("circle")
      .attr("r", d => d.radius + 5)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.5)
      .attr("class", "attention-pulse");
      
    // Add animation to attention pulse
    node.selectAll(".attention-pulse")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", d => `${d.radius + 5};${d.radius + 15};${d.radius + 5}`)
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");
      
    // Add representative token logos
    node.each(function(d) {
      if (!d.representativeTokens || d.representativeTokens.length === 0) return;
      
      const numLogos = Math.min(d.representativeTokens.length, 3);
      const logoRadius = d.radius * 0.25;
      
      // Position logos in a circle around the center
      d.representativeTokens.slice(0, numLogos).forEach((token, i) => {
        // Create clip path for circular logos
        const clipId = `clip-${d.id}-${token.symbol}`;
        
        defs.append("clipPath")
          .attr("id", clipId)
          .append("circle")
          .attr("r", logoRadius);
        
        // Calculate position in a circle
        const angle = (2 * Math.PI * i) / numLogos;
        // Place logos at 60% of the way from center to edge
        const distance = d.radius * 0.6;
        const x = Math.sin(angle) * distance;
        const y = Math.cos(angle) * distance;
        
        // Add circular background for the logo
        d3.select(this)
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", logoRadius)
          .attr("fill", "white")
          .attr("opacity", 0.9);
        
        // Use better fallback images
        const logoUrl = getCryptoLogoUrl(token.symbol);
        
        // Add the logo image with error handling
        const img = d3.select(this)
          .append("image")
          .attr("x", x - logoRadius)
          .attr("y", y - logoRadius)
          .attr("width", logoRadius * 2)
          .attr("height", logoRadius * 2)
          .attr("href", logoUrl)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice");
        
        // Add error handling for the image
        img.on("error", function() {
          d3.select(this).attr("href", getFallbackLogoUrl());
        });
      });
    });

    // Add node labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 15)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", d => Math.min(d.radius * 0.4, 14))
      .text(d => d.name);

    // Add attention score for nodes with high attention
    node.filter(d => d.attentionScore && d.attentionScore > 30)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(d => `${d.attentionScore}%`);
      
    // Add orbit animations for non-central nodes
    let lastTimestamp = 0;
    const orbitAnimationFrame = () => {
      const now = Date.now();
      const elapsed = now - lastTimestamp;
      lastTimestamp = now;
      
      // Skip if no time has passed (prevents jumps on first frame)
      if (elapsed === 0) {
        requestAnimationFrame(orbitAnimationFrame);
        return;
      }
      
      // Apply subtle rotation to all non-central nodes
      if (centralNode) {
        const rotationSpeed = 0.00005; // Very slow rotation
        
        nodes.forEach(node => {
          if (node === centralNode) return;
          
          // Calculate current angle from center
          const dx = node.x - centralNode.x;
          const dy = node.y - centralNode.y;
          const angle = Math.atan2(dy, dx) + rotationSpeed * elapsed;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Update position with rotation
          node.x = centralNode.x + Math.cos(angle) * distance;
          node.y = centralNode.y + Math.sin(angle) * distance;
        });
        
        // Update node positions
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        
        // Update link paths using curved lines
        link.attr("d", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
      }
      
      requestAnimationFrame(orbitAnimationFrame);
    };
    
    // Start orbital animation
    lastTimestamp = Date.now();
    const animationFrameId = requestAnimationFrame(orbitAnimationFrame);

    return {
      link,
      node,
      svg,
      animationFrameId
    };
  };

  // Update element positions on tick
  const updatePositions = (elements: any, nodes: NarrativeNode[], links: any[]) => {
    const { link, node, svg } = elements;
    
    // Update link paths using curved lines
    link.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curved path
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });

    // Update particle positions
    svg.selectAll(".flow-particle").each(function() {
      const particle = d3.select(this);
      const linkIndex = parseInt(particle.attr("data-link-index"));
      const particleIndex = parseInt(particle.attr("data-particle-index"));
      
      if (Number.isNaN(linkIndex) || linkIndex >= links.length) return;
      
      const link = links[linkIndex];
      
      try {
        // Get current position along the path
        const t = ((Date.now() / 3000) + (particleIndex * 0.3)) % 1;
        
        // Get the path element for this link
        const pathElements = svg.selectAll(".link").nodes();
        if (linkIndex >= pathElements.length) return;
        
        const pathElement = pathElements[linkIndex];
        const pathLength = pathElement.getTotalLength();
        const point = pathElement.getPointAtLength(pathLength * t);
        
        // Set the particle position
        particle
          .attr("cx", point.x)
          .attr("cy", point.y);
      } catch (e) {
        console.error(e);
      }
    });

    // Update node positions
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  };

  return {
    drawVisualization,
    updatePositions
  };
};
