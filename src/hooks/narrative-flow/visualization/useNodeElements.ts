
import * as d3 from 'd3';
import { NarrativeNode } from '@/types/narratives';
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';
import { useFiltersAndEffects } from './useFiltersAndEffects';
import { TokenLogo } from './types';

export const useNodeElements = () => {
  const { createClipPath } = useFiltersAndEffects();
  
  // Create node elements for the visualization
  const createNodes = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    nodes: NarrativeNode[],
    dragHandlers: any,
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>
  ) => {
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
      
    addAttentionIndicators(node);
    addTokenLogos(node, defs);
    addNodeLabels(node);
    
    return { node, nodeGroup };
  };
  
  // Add pulsing effect for high attention narratives
  const addAttentionIndicators = (
    node: d3.Selection<SVGGElement, NarrativeNode, SVGGElement, unknown>
  ) => {
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
      .attr("values", (d: any) => `${d.radius + 5};${d.radius + 15};${d.radius + 5}`)
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");
  };
  
  // Add logos of representative tokens
  const addTokenLogos = (
    node: d3.Selection<SVGGElement, NarrativeNode, SVGGElement, unknown>,
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>
  ) => {
    // Add representative token logos
    node.each(function(d) {
      if (!d.representativeTokens || d.representativeTokens.length === 0) return;
      
      const numLogos = Math.min(d.representativeTokens.length, 3);
      const logoRadius = d.radius * 0.25;
      
      // Position logos in a circle around the center
      d.representativeTokens.slice(0, numLogos).forEach((token, i) => {
        // Create clip path for circular logos
        const clipId = `clip-${d.id}-${token.symbol}`;
        createClipPath(defs, clipId, logoRadius);
        
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
        
        // Get the correct logo URL from our cryptoLogos utility
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
  };
  
  // Add text labels for nodes
  const addNodeLabels = (
    node: d3.Selection<SVGGElement, NarrativeNode, SVGGElement, unknown>
  ) => {
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
  };

  // Update node positions
  const updateNodePositions = (
    node: d3.Selection<SVGGElement, NarrativeNode, SVGGElement, unknown>
  ) => {
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  };

  return {
    createNodes,
    updateNodePositions
  };
};
