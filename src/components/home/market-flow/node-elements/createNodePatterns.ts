
import { getCryptoLogoUrl, getFallbackLogoUrl } from '@/lib/cryptoLogos';

export const createNodePatterns = (
  svg: any,
  nodes: any[]
) => {
  // Create defs for logo image patterns using native DOM methods
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);
  
  // Create patterns for each node to hold the logo
  nodes.forEach(node => {
    const patternId = `logo-${node.id}`;
    const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("width", "1");
    pattern.setAttribute("height", "1");
    pattern.setAttribute("patternUnits", "objectBoundingBox");
      
    // Add image to pattern
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    const logoUrl = getCryptoLogoUrl(node.id.toLowerCase()) || 
                  getFallbackLogoUrl() ||
                  `https://cryptocurrencyliveprices.com/img/${node.id.toLowerCase()}.png`;
    
    image.setAttribute("href", logoUrl);
    image.setAttribute("width", (node.radius * 2 * 0.8).toString());
    image.setAttribute("height", (node.radius * 2 * 0.8).toString());
    image.setAttribute("x", (node.radius * 0.2).toString());
    image.setAttribute("y", (node.radius * 0.2).toString());
    image.setAttribute("preserveAspectRatio", "xMidYMid slice");
    
    image.addEventListener("error", function() {
      // Fallback to alternative source if primary logo fails to load
      image.setAttribute("href", getFallbackLogoUrl());
    });
    
    pattern.appendChild(image);
    defs.appendChild(pattern);
  });
};
