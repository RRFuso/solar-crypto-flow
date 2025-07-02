
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

export const OrbitLayersComponent: React.FC<OrbitLayersProps> = ({
  svg,
  width,
  height,
  orbitLayers,
  baseRadius,
  extendFullScreen = false
}) => {
  useEffect(() => {
    if (!svg) return;

    // Remove existing orbit layers
    svg.selectAll('.orbit-layer').remove();

    const orbitGroup = svg.append('g').attr('class', 'orbit-layers');
    const centerX = width / 2;
    const centerY = height / 2;

    // **CRITICAL: Much more compact and visible orbit spacing**
    const maxRadius = Math.min(width, height) * 0.35; // Conservative max radius
    const minRadius = maxRadius * 0.25; // Start much closer to center
    
    for (let i = 1; i <= orbitLayers; i++) {
      // **Linear spacing for uniform distribution**
      const radiusStep = (maxRadius - minRadius) / (orbitLayers - 1);
      const radius = minRadius + ((i - 1) * radiusStep);
      
      // Skip if radius would exceed viewport
      if (radius > maxRadius) continue;
      
      // Create orbit circle with enhanced visibility
      orbitGroup.append('circle')
        .attr('class', 'orbit-layer')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', `rgba(255, 255, 255, ${Math.max(0.1, 0.25 - i * 0.03)})`) // More visible
        .attr('stroke-width', Math.max(1, 2 - i * 0.1)) // Thicker lines
        .attr('stroke-dasharray', `${Math.max(3, 6 - i)},${Math.max(3, 6 - i)}`) // Cleaner dash pattern
        .style('pointer-events', 'none');

      // **Orbital markers for reference points**
      const markerCount = Math.max(4, i * 2); // More markers for outer orbits
      for (let j = 0; j < markerCount; j++) {
        const angle = (j / markerCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        orbitGroup.append('circle')
          .attr('class', 'orbit-marker')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', Math.max(0.5, 1.5 - i * 0.1)) // Visible markers
          .attr('fill', `rgba(255, 255, 255, ${Math.max(0.08, 0.15 - i * 0.02)})`)
          .style('pointer-events', 'none');
      }
    }

    // **Enhanced central reference point**
    orbitGroup.append('circle')
      .attr('class', 'central-reference')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 2) // Slightly larger for visibility
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
      .style('pointer-events', 'none');

    return () => {
      svg.selectAll('.orbit-layers').remove();
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
