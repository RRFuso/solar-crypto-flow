
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

    // COMPACT SCALE: Much smaller orbit visualization for viewport fit
    for (let i = 1; i <= orbitLayers; i++) {
      // Significantly reduced spacing multiplier from 1.8 to 1.3 for compact visualization
      const radius = baseRadius * i * 1.3;
      
      // More restrictive max radius check for compact viewport fit
      const maxAllowedRadius = Math.min(width, height) / 3; // Changed from /2.5 to /3
      if (radius > maxAllowedRadius) continue;
      
      // Create orbit circle with subtle styling for compact view
      orbitGroup.append('circle')
        .attr('class', 'orbit-layer')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', `rgba(255, 255, 255, ${Math.max(0.03, 0.15 - i * 0.02)})`) // Reduced opacity for subtlety
        .attr('stroke-width', Math.max(0.3, 1.5 - i * 0.12)) // Thinner strokes
        .attr('stroke-dasharray', `${Math.max(2, 5 - i)},${Math.max(2, 5 - i)}`) // Smaller dash pattern
        .style('pointer-events', 'none');

      // Fewer orbit markers for cleaner compact look
      if (i <= 1) { // Further reduced from 2 to 1 for minimal clutter
        const markerCount = Math.max(2, i * 2); // Reduced marker count
        for (let j = 0; j < markerCount; j++) {
          const angle = (j / markerCount) * 2 * Math.PI;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          orbitGroup.append('circle')
            .attr('class', 'orbit-marker')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', Math.max(0.3, 1.2 - i * 0.15)) // Smaller markers
            .attr('fill', `rgba(255, 255, 255, ${Math.max(0.04, 0.12 - i * 0.02)})`)
            .style('pointer-events', 'none');
        }
      }
    }

    // Smaller central reference point
    orbitGroup.append('circle')
      .attr('class', 'central-reference')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 1.5) // Reduced from 2
      .attr('fill', 'rgba(255, 255, 255, 0.3)')
      .style('pointer-events', 'none');

    return () => {
      svg.selectAll('.orbit-layers').remove();
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
