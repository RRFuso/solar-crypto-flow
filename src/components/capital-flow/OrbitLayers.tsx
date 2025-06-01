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

    // Enhanced orbit visualization with better spacing
    for (let i = 1; i <= orbitLayers; i++) {
      const radius = baseRadius * i * 2.5; // Increased spacing multiplier
      
      // Skip orbits that would be too large for the screen
      if (radius > Math.min(width, height) / 2 - 50) continue;
      
      // Create orbit circle with enhanced styling
      orbitGroup.append('circle')
        .attr('class', 'orbit-layer')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', `rgba(255, 255, 255, ${Math.max(0.03, 0.15 - i * 0.02)})`) // Fading opacity
        .attr('stroke-width', Math.max(0.5, 2 - i * 0.2)) // Decreasing width
        .attr('stroke-dasharray', `${Math.max(2, 8 - i)},${Math.max(2, 8 - i)}`) // Dynamic dash pattern
        .style('pointer-events', 'none');

      // Add orbit markers for better visual reference
      if (i <= 3) { // Only for inner orbits
        const markerCount = Math.max(4, i * 2);
        for (let j = 0; j < markerCount; j++) {
          const angle = (j / markerCount) * 2 * Math.PI;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          orbitGroup.append('circle')
            .attr('class', 'orbit-marker')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', Math.max(0.5, 2 - i * 0.3))
            .attr('fill', `rgba(255, 255, 255, ${Math.max(0.05, 0.2 - i * 0.05)})`)
            .style('pointer-events', 'none');
        }
      }
    }

    // Add central reference point
    orbitGroup.append('circle')
      .attr('class', 'central-reference')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 2)
      .attr('fill', 'rgba(255, 255, 255, 0.3)')
      .style('pointer-events', 'none');

    return () => {
      svg.selectAll('.orbit-layers').remove();
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
