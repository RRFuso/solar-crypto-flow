import { useCallback } from 'react';
import * as THREE from 'three';

export const useThree = () => {
  const init = useCallback((container: HTMLDivElement) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 120;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.5, metalness: 1 });
    const knot = new THREE.Mesh(geometry, material);
    scene.add(knot);

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(50, 50, 50);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      knot.rotation.x += 0.01;
      knot.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    const cleanup = () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };

    return { cleanup };
  }, []);

  const animate = useCallback(() => {
    // No-op in this context. Animation is handled in `init`.
  }, []);

  return { init, animate };
};
