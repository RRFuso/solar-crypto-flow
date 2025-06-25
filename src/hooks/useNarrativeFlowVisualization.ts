
import { useEffect, RefObject } from 'react';
import { NarrativeFlow, NarrativeData } from '@/types/narratives';

interface VisualizationConfig {
  width: number;
  height: number;
  narratives: NarrativeData[];
  flowData: NarrativeFlow[];
  isPredicted: boolean;
}

export const useNarrativeFlowVisualization = (
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  config: VisualizationConfig
) => {
  const { width, height, narratives, flowData, isPredicted } = config;

  useEffect(() => {
    if (!flowData || flowData.length === 0 || !svgRef.current || !containerRef.current) return;
    
    // Simple SVG-based visualization without d3
    const svg = svgRef.current;
    
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("style", "max-width: 100%; height: auto;");
    
    // Create starfield background
    const starGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    starGroup.setAttribute("class", "starfield");
    
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 1.5 + 0.1;
      const opacity = Math.random() * 0.6 + 0.1;
      
      const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      star.setAttribute("cx", x.toString());
      star.setAttribute("cy", y.toString());
      star.setAttribute("r", size.toString());
      star.setAttribute("fill", "white");
      star.setAttribute("opacity", opacity.toString());
      
      starGroup.appendChild(star);
    }
    
    svg.appendChild(starGroup);
    
    // Create nodes from narratives
    const centerX = width / 2;
    const centerY = height / 2;
    
    narratives.forEach((narrative, index) => {
      const angle = (index * Math.PI * 2) / narratives.length;
      const distance = Math.min(width, height) * 0.3;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const radius = Math.max(20, Math.min(50, Math.sqrt(narrative.marketCap) * 2));
      
      // Create node circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x.toString());
      circle.setAttribute("cy", y.toString());
      circle.setAttribute("r", radius.toString());
      circle.setAttribute("fill", narrative.color);
      circle.setAttribute("opacity", "0.8");
      circle.setAttribute("stroke", "white");
      circle.setAttribute("stroke-width", "2");
      
      svg.appendChild(circle);
      
      // Create label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x.toString());
      text.setAttribute("y", (y + 5).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "white");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "Arial");
      text.textContent = narrative.name;
      
      svg.appendChild(text);
    });
    
    // Create flow connections
    flowData.forEach(flow => {
      const sourceNarrative = narratives.find(n => n.id === flow.from);
      const targetNarrative = narratives.find(n => n.id === flow.to);
      
      if (sourceNarrative && targetNarrative) {
        const sourceIndex = narratives.indexOf(sourceNarrative);
        const targetIndex = narratives.indexOf(targetNarrative);
        
        const sourceAngle = (sourceIndex * Math.PI * 2) / narratives.length;
        const targetAngle = (targetIndex * Math.PI * 2) / narratives.length;
        const distance = Math.min(width, height) * 0.3;
        
        const sourceX = centerX + Math.cos(sourceAngle) * distance;
        const sourceY = centerY + Math.sin(sourceAngle) * distance;
        const targetX = centerX + Math.cos(targetAngle) * distance;
        const targetY = centerY + Math.sin(targetAngle) * distance;
        
        // Create flow line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", sourceX.toString());
        line.setAttribute("y1", sourceY.toString());
        line.setAttribute("x2", targetX.toString());
        line.setAttribute("y2", targetY.toString());
        line.setAttribute("stroke", flow.predicted ? "#ff6b35" : "#4ade80");
        line.setAttribute("stroke-width", Math.max(1, Math.abs(flow.value) / 100).toString());
        line.setAttribute("opacity", "0.6");
        
        svg.appendChild(line);
      }
    });
    
    return () => {
      // Cleanup function
    };
  }, [config, svgRef, containerRef, width, height, narratives, flowData, isPredicted]);
};
