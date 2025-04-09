
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface OrbitLayersProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
  extendFullScreen?: boolean;
}

export const OrbitLayersComponent = React.memo((props: OrbitLayersProps) => {
  const { svg, width, height, orbitLayers, baseRadius, extendFullScreen = true } = props;
  
  useEffect(() => {
    // Clear existing orbit layers
    svg.selectAll('.orbit-layers').remove();
    
    // Create orbit layers group
    const orbitGroup = svg.append("g").attr("class", "orbit-layers");
    
    // Calculate max radius to cover entire screen
    const maxScreenRadius = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2));
    
    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw orbit circles
    for (let i = 1; i <= orbitLayers; i++) {
      // Calculate radius - either use incremental base radius or extend to full screen
      let orbitRadius = extendFullScreen
        ? (maxScreenRadius / orbitLayers) * i // Distribute evenly across full screen
        : baseRadius * i; // Use incremental base radius
      
      orbitGroup.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", orbitRadius)
        .attr("fill", "none")
        .attr("stroke", "rgba(255, 255, 255, 0.05)")
        .attr("stroke-width", i === 1 ? 2 : 1) // Make inner orbit slightly thicker
        .attr("stroke-dasharray", "3,3");
    }
    
    // Add faint radial lines for better spatial orientation
    const radialLineCount = 12;
    for (let i = 0; i < radialLineCount; i++) {
      const angle = (i / radialLineCount) * Math.PI * 2;
      const lineEndX = centerX + Math.cos(angle) * maxScreenRadius;
      const lineEndY = centerY + Math.sin(angle) * maxScreenRadius;
      
      orbitGroup.append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", lineEndX)
        .attr("y2", lineEndY)
        .attr("stroke", "rgba(255, 255, 255, 0.03)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,4");
    }
    
    return () => {
      svg.selectAll('.orbit-layers').remove();
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);
  
  return null;
});
