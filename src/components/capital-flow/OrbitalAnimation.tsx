import React, { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitalNode } from './NodePlacement';

interface NodeUserData {
  nodeId: string;
}

interface OrbitalAnimationProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  scene,
  camera,
  renderer,
  nodes,
  width,
  height,
  rotationSpeed = 0.00008,
}) => {
  useEffect(() => {
    if (!scene || !camera || !renderer || nodes.length === 0) return;

    const centralNode = nodes.find(node => node.type === "central");
    const orbitalNodes = nodes.filter(node => node.type === "orbital");
    
    if (!centralNode) return;

    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - startTime) * rotationSpeed;

      orbitalNodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return; // Ensure x and y are defined

        const dx = node.x - width / 2;
        const dy = node.y - height / 2;
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        
        const marketCapFactor = Math.max(0.2, Math.min(1.5, Math.log10(node.marketCap || 1) / 8));
        const speed = rotationSpeed / (marketCapFactor * 0.6);
        
        const currentAngle = Math.atan2(dy, dx);
        const newAngle = currentAngle + speed;
        
        node.x = width / 2 + Math.cos(newAngle) * currentRadius;
        node.y = height / 2 + Math.sin(newAngle) * currentRadius;

        // Update Three.js object positions
        const threeObject = scene.getObjectByProperty('userData', { nodeId: node.id });
        if (threeObject) {
          (threeObject.userData as NodeUserData).nodeId = node.id; // Ensure userData is typed
          threeObject.position.set(node.x - width / 2, -(node.y - height / 2), 0); // Adjust for Three.js coordinate system
        }
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [scene, camera, renderer, nodes, width, height, rotationSpeed]);

  return null;
};
