
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
    const existingLayers = svg.querySelectorAll('.orbit-layer, .orbit-marker, .central-reference');
    existingLayers.forEach(layer => layer.remove());

    const orbitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    orbitGroup.setAttribute('class', 'orbit-layers');
    svg.appendChild(orbitGroup);

    const centerX = width / 2;
    const centerY = height / 2;

    // Enhanced orbital system with better visibility
    const maxRadius = Math.min(width, height) * 0.4; // Increased for better spread
    const minRadius = maxRadius * 0.2; // Start closer to center
    
    for (let i = 1; i <= orbitLayers; i++) {
      // Exponential spacing for more natural orbit distribution
      const radiusProgress = Math.pow(i / orbitLayers, 1.2);
      const radius = minRadius + (maxRadius - minRadius) * radiusProgress;
      
      // Create main orbit circle
      const orbitCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      orbitCircle.setAttribute('class', 'orbit-layer');
      orbitCircle.setAttribute('cx', centerX.toString());
      orbitCircle.setAttribute('cy', centerY.toString());
      orbitCircle.setAttribute('r', radius.toString());
      orbitCircle.setAttribute('fill', 'none');
      orbitCircle.setAttribute('stroke', `rgba(255, 255, 255, ${Math.max(0.15, 0.4 - i * 0.05)})`);
      orbitCircle.setAttribute('stroke-width', (3 - i * 0.2).toString());
      orbitCircle.setAttribute('stroke-dasharray', `${8 - i},${8 - i}`);
      orbitCircle.style.pointerEvents = 'none';
      
      // Add subtle animation
      orbitCircle.style.animation = `rotation ${60 + i * 20}s linear infinite`;
      
      orbitGroup.appendChild(orbitCircle);

      // Orbital reference markers
      const markerCount = Math.max(6, i * 3);
      for (let j = 0; j < markerCount; j++) {
        const angle = (j / markerCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        marker.setAttribute('class', 'orbit-marker');
        marker.setAttribute('cx', x.toString());
        marker.setAttribute('cy', y.toString());
        marker.setAttribute('r', (2 - i * 0.2).toString());
        marker.setAttribute('fill', `rgba(255, 255, 255, ${Math.max(0.1, 0.25 - i * 0.03)})`);
        marker.style.pointerEvents = 'none';
        orbitGroup.appendChild(marker);
      }
    }

    // Enhanced central reference point with glow
    const centralGlow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralGlow.setAttribute('class', 'central-reference-glow');
    centralGlow.setAttribute('cx', centerX.toString());
    centralGlow.setAttribute('cy', centerY.toString());
    centralGlow.setAttribute('r', '12');
    centralGlow.setAttribute('fill', 'rgba(255, 165, 0, 0.3)');
    centralGlow.setAttribute('filter', 'blur(4px)');
    centralGlow.style.pointerEvents = 'none';
    orbitGroup.appendChild(centralGlow);

    const centralRef = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centralRef.setAttribute('class', 'central-reference');
    centralRef.setAttribute('cx', centerX.toString());
    centralRef.setAttribute('cy', centerY.toString());
    centralRef.setAttribute('r', '4');
    centralRef.setAttribute('fill', 'rgba(255, 165, 0, 0.8)');
    centralRef.style.pointerEvents = 'none';
    orbitGroup.appendChild(centralRef);

    return () => {
      const layers = svg.querySelectorAll('.orbit-layers');
      layers.forEach(layer => layer.remove());
    };
  }, [svg, width, height, orbitLayers, baseRadius, extendFullScreen]);

  return null;
};
