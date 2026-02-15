
import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface OrbitLayersProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  width: number;
  height: number;
  orbitLayers: number;
  baseRadius: number;
  extendFullScreen?: boolean;
  showLines: boolean;
}

export const OrbitLayersComponent: React.FC<OrbitLayersProps> = ({
  svg,
  width,
  height,
  orbitLayers,
  baseRadius,
  extendFullScreen = false,
  showLines
}) => {
  useEffect(() => {
    if (!svg) return;

    // Remove existing orbit layers
    svg.selectAll('.orbit-layers').remove();

    if (showLines) {
      // If lines are shown, do not render the orbits to reduce clutter.
      return;
    }

    const orbitGroup = svg.append('g').attr('class', 'orbit-layers');
    const centerX = width / 2;
    const centerY = height / 2;

    // Elliptical orbits: use full width, constrained height
    const maxRx = width / 2 - 60; // horizontal radius uses full width
    const maxRy = height / 2 - 60; // vertical radius uses full height
    const minRx = maxRx * 0.2;
    const minRy = maxRy * 0.2;
    
    for (let i = 1; i <= orbitLayers; i++) {
      const t = (i - 1) / (orbitLayers - 1);
      const rx = minRx + t * (maxRx - minRx);
      const ry = minRy + t * (maxRy - minRy);
      
      // Create orbit ellipse
      orbitGroup.append('ellipse')
        .attr('class', 'orbit-layer')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('rx', rx)
        .attr('ry', ry)
        .attr('fill', 'none')
        .attr('stroke', `rgba(255, 255, 255, ${Math.max(0.1, 0.25 - i * 0.03)})`)
        .attr('stroke-width', Math.max(1, 2 - i * 0.1))
        .attr('stroke-dasharray', `${Math.max(3, 6 - i)},${Math.max(3, 6 - i)}`)
        .style('pointer-events', 'none');

      // Orbital markers on ellipse
      const markerCount = Math.max(4, i * 2);
      for (let j = 0; j < markerCount; j++) {
        const angle = (j / markerCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * rx;
        const y = centerY + Math.sin(angle) * ry;
        
        orbitGroup.append('circle')
          .attr('class', 'orbit-marker')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', Math.max(0.5, 1.5 - i * 0.1))
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
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen, showLines]);

  return null;
};
