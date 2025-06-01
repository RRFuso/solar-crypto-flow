
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

    // FIXED: Adjusted orbit visualization for better viewport fit
    for (let i = 1; i <= orbitLayers; i++) {
      // Reduced spacing multiplier from 2.5 to 1.8 for viewport fit
      const radius = baseRadius * i * 1.8;
      
      // More conservative max radius check for viewport fit
      const maxAllowedRadius = Math.min(width, height) / 2.5; // Changed from /2-50 to /2.5
      if (radius > maxAllowedRadius) continue;
      
      // Create orbit circle with enhanced styling
      orbitGroup.append('circle')
        .attr('class', 'orbit-layer')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', `rgba(255, 255, 255, ${Math.max(0.04, 0.18 - i * 0.02)})`) // Slightly increased opacity
        .attr('stroke-width', Math.max(0.5, 1.8 - i * 0.15)) // Adjusted width
        .attr('stroke-dasharray', `${Math.max(3, 6 - i)},${Math.max(3, 6 - i)}`) // Adjusted dash pattern
        .style('pointer-events', 'none');

      // Add orbit markers for better visual reference (fewer for cleaner look)
      if (i <= 2) { // Reduced from 3 to 2 for cleaner look
        const markerCount = Math.max(3, i * 2); // Reduced marker count
        for (let j = 0; j < markerCount; j++) {
          const angle = (j / markerCount) * 2 * Math.PI;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          orbitGroup.append('circle')
            .attr('class', 'orbit-marker')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', Math.max(0.4, 1.5 - i * 0.2)) // Slightly smaller markers
            .attr('fill', `rgba(255, 255, 255, ${Math.max(0.06, 0.15 - i * 0.03)})`)
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
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
      .style('pointer-events', 'none');

    return () => {
      svg.selectAll('.orbit-layers').remove();
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
