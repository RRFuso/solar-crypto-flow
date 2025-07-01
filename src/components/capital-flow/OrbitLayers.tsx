
import React, { useEffect } from 'react';

interface OrbitLayersProps {
  svg: SVGSVGElement;
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
    const existingLayers = svg.querySelectorAll('.orbit-layer');
    existingLayers.forEach(layer => layer.remove());

    const orbitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    orbitGroup.setAttribute('class', 'orbit-layers');
    svg.appendChild(orbitGroup);

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
      const orbitCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      orbitCircle.setAttribute('class', 'orbit-layer');
      orbitCircle.setAttribute('cx', centerX.toString());
      orbitCircle.setAttribute('cy', centerY.toString());
      orbitCircle.setAttribute('r', radius.toString());
      orbitCircle.setAttribute('fill', 'none');
      orbitCircle.setAttribute('stroke', `rgba(255, 255, 255, ${Math.max(0.1, 0.25 - i * 0.03)})`);
      orbitCircle.setAttribute('stroke-width', Math.max(1, 2 - i * 0.1).toString());
      orbitCircle.setAttribute('stroke-dasharray', `${Math.max(3, 6 - i)},${Math.max(3, 6 - i)}`);
      orbitCircle.style.pointerEvents = 'none';
      orbitGroup.appendChild(orbitCircle);

      // **Orbital markers for reference points**
      const markerCount = Math.max(4, i * 2); // More markers for outer orbits
      for (let j = 0; j < markerCount; j++) {
        const angle = (j / markerCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        marker.setAttribute('class', 'orbit-marker');
        marker.setAttribute('cx', x.toString());
        marker.setAttribute('cy', y.toString());
        marker.setAttribute('r', Math.max(0.5, 1.5 - i * 0.1).toString());
        marker.setAttribute('fill', `rgba(255, 255, 255, ${Math.max(0.08, 0.15 - i * 0.02)})`);
        marker.style.pointerEvents = 'none';
        orbitGroup.appendChild(marker);
      }
    }

    // **Enhanced central reference point**
    const centralRef = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralRef.setAttribute('class', 'central-reference');
    centralRef.setAttribute('cx', centerX.toString());
    centralRef.setAttribute('cy', centerY.toString());
    centralRef.setAttribute('r', '2');
    centralRef.setAttribute('fill', 'rgba(255, 255, 255, 0.4)');
    centralRef.style.pointerEvents = 'none';
    orbitGroup.appendChild(centralRef);

    return () => {
      const layers = svg.querySelectorAll('.orbit-layers');
      layers.forEach(layer => layer.remove());
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
