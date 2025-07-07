import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  width: number;
  height: number;
}

export interface ThreeSceneHandles {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
}

export const ThreeScene = forwardRef<ThreeSceneHandles, ThreeSceneProps>(({ width, height }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, width / height, 0.1, 1000));
  const renderer = useRef<THREE.WebGLRenderer | null>(null);

  useImperativeHandle(ref, () => ({
    scene: scene.current,
    camera: camera.current,
    renderer: renderer.current!,
    canvas: renderer.current!.domElement,
  }));

  useEffect(() => {
    if (mountRef.current) {
      // Set up renderer
      renderer.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.current.setSize(width, height);
      mountRef.current.appendChild(renderer.current.domElement);

      // Set up camera position
      camera.current.position.z = 500; // Adjust as needed

      // Add a light source
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.current.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 1, 1).normalize();
      scene.current.add(directionalLight);

      // Animation loop (will be managed by OrbitalAnimationComponent later)
      const animate = () => {
        requestAnimationFrame(animate);
        if (renderer.current) {
          renderer.current.render(scene.current, camera.current);
        }
      };
      animate();

      const currentMount = mountRef.current;
      const currentRenderer = renderer.current;

      return () => {
        if (currentMount && currentRenderer) {
          currentMount.removeChild(currentRenderer.domElement);
          currentRenderer.dispose();
        }
      };
    }
  }, [width, height]);

  useEffect(() => {
    if (renderer.current) {
      renderer.current.setSize(width, height);
      camera.current.aspect = width / height;
      camera.current.updateProjectionMatrix();
    }
  }, [width, height]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
});
