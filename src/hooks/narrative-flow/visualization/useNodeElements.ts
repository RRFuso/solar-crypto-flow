
import { NarrativeNode } from '@/types/narratives';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { useFiltersAndEffects } from './useFiltersAndEffects';

export const useNodeElements = () => {
  const { createClipPath } = useFiltersAndEffects();
  
  // Create node elements for the visualization using native DOM methods
  const createNodes = (
    svg: any,
    nodes: NarrativeNode[],
    dragHandlers: any,
    defs: any
  ) => {
    // Add nodes
    const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeGroup.setAttribute("class", "nodes");
    svg.appendChild(nodeGroup);
    
    const nodeElements: SVGGElement[] = [];
    
    nodes.forEach(d => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
      node.setAttribute("class", "node");
      node.setAttribute("data-id", d.id);
      node.setAttribute("transform", `translate(${d.x},${d.y})`);
      
      // Add glowing effect around nodes
      const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      glow.setAttribute("class", "node-glow");
      glow.setAttribute("r", (d.radius * 1.5).toString());
      glow.setAttribute("fill", d.color);
      glow.setAttribute("opacity", "0.3");
      glow.setAttribute("filter", "url(#glow)");
      node.appendChild(glow);
      
      // Add node circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", d.radius.toString());
      circle.setAttribute("fill", d.color);
      circle.setAttribute("stroke", d.attentionScore && d.attentionScore > 50 ? "#ffffff" : "rgba(255,255,255,0.5)");
      circle.setAttribute("stroke-width", d.attentionScore && d.attentionScore > 50 ? "3" : "2");
      circle.setAttribute("opacity", "0.7");
      circle.setAttribute("filter", "url(#glow)");
      node.appendChild(circle);
      
      // Add attention indicators
      if (d.attentionScore && d.attentionScore > 70) {
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("r", (d.radius + 5).toString());
        pulse.setAttribute("fill", "none");
        pulse.setAttribute("stroke", "#ffffff");
        pulse.setAttribute("stroke-width", "2");
        pulse.setAttribute("opacity", "0.5");
        pulse.setAttribute("class", "attention-pulse");
        
        const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animate.setAttribute("attributeName", "r");
        animate.setAttribute("values", `${d.radius + 5};${d.radius + 15};${d.radius + 5}`);
        animate.setAttribute("dur", "2s");
        animate.setAttribute("repeatCount", "indefinite");
        pulse.appendChild(animate);
        
        node.appendChild(pulse);
      }
      
      // Add token logos
      if (d.representativeTokens && d.representativeTokens.length > 0) {
        const numLogos = Math.min(d.representativeTokens.length, 3);
        const logoRadius = d.radius * 0.25;
        
        d.representativeTokens.slice(0, numLogos).forEach((token, i) => {
          const clipId = `clip-${d.id}-${token.symbol}`;
          createClipPath(defs, clipId, logoRadius);
          
          const angle = (2 * Math.PI * i) / numLogos;
          const distance = d.radius * 0.6;
          const x = Math.sin(angle) * distance;
          const y = Math.cos(angle) * distance;
          
          // Add circular background
          const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          bg.setAttribute("cx", x.toString());
          bg.setAttribute("cy", y.toString());
          bg.setAttribute("r", logoRadius.toString());
          bg.setAttribute("fill", "white");
          bg.setAttribute("opacity", "0.9");
          node.appendChild(bg);
          
          // Add logo image
          const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
          img.setAttribute("x", (x - logoRadius).toString());
          img.setAttribute("y", (y - logoRadius).toString());
          img.setAttribute("width", (logoRadius * 2).toString());
          img.setAttribute("height", (logoRadius * 2).toString());
          img.setAttribute("href", getCryptoLogoUrl(token.symbol));
          img.setAttribute("clip-path", `url(#${clipId})`);
          img.setAttribute("preserveAspectRatio", "xMidYMid slice");
          
          img.addEventListener("error", () => {
            img.setAttribute("href", getFallbackLogoUrl());
          });
          
          node.appendChild(img);
        });
      }
      
      // Add node labels
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dy", (d.radius + 15).toString());
      label.setAttribute("fill", "white");
      label.setAttribute("font-weight", "bold");
      label.setAttribute("font-size", Math.min(d.radius * 0.4, 14).toString());
      label.textContent = d.name;
      node.appendChild(label);
      
      // Add attention score
      if (d.attentionScore && d.attentionScore > 30) {
        const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        scoreText.setAttribute("text-anchor", "middle");
        scoreText.setAttribute("dy", "-5");
        scoreText.setAttribute("fill", "white");
        scoreText.setAttribute("font-weight", "bold");
        scoreText.setAttribute("font-size", "12");
        scoreText.textContent = `${d.attentionScore}%`;
        node.appendChild(scoreText);
      }
      
      nodeGroup.appendChild(node);
      nodeElements.push(node);
    });
    
    return { node: nodeElements, nodeGroup };
  };

  // Update node positions
  const updateNodePositions = (nodeElements: SVGGElement[]) => {
    // Positions are managed by the animation system
  };

  return {
    createNodes,
    updateNodePositions
  };
};
