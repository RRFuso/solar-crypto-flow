
import * as d3 from 'd3';
import { useCryptoLogos } from '@/contexts/CryptoLogosContext';

export const useNodeLogos = () => {
  const { getLogo } = useCryptoLogos();
  
  // Add representative token logos to nodes
  const addNodeLogos = (nodes: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>, svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    nodes.each(function(d) {
      if (!d.representativeTokens || d.representativeTokens.length === 0) return;
      
      const numLogos = Math.min(d.representativeTokens.length, 3);
      const logoRadius = d.radius * 0.25;
      
      // Position logos in a circle around the center
      d.representativeTokens.slice(0, numLogos).forEach((token, i) => {
        // Create clip path for circular logos
        const clipId = `clip-${d.id}-${token.symbol}`;
        
        const defs = svg.select("defs");
        
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
        
        // Get logo URL from our context
        const logoUrl = getLogo(token.symbol);
        
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
          // If the image fails to load, update with fallback
          d3.select(this).attr("href", 'https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg');
        });
      });
    });
  };

  // Add node labels and attention scores
  const addNodeLabels = (node: d3.Selection<d3.BaseType, any, d3.BaseType, unknown>) => {
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

  return {
    addNodeLogos,
    addNodeLabels
  };
};
