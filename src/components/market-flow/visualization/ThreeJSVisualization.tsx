import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Sphere, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CryptoNode {
  id: string;
  symbol: string;
  name: string;
  position: [number, number, number];
  size: number;
  color: string;
  logoUrl?: string;
}

interface CryptoLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

interface ThreeJSVisualizationProps {
  nodes: CryptoNode[];
  links: CryptoLink[];
  width: number;
  height: number;
}

const CryptoSphere: React.FC<{ node: CryptoNode; onClick?: (node: CryptoNode) => void }> = ({ node, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Orbital animation
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * 0.5;
      
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(time * 2 + node.position[0]) * 0.1;
    }
  });

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[node.size, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick?.(node)}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={hovered ? node.color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere args={[node.size * 1.2, 32, 32]}>
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.1}
        />
      </Sphere>
      
      {/* Text label */}
      <Text
        position={[0, node.size + 0.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.symbol}
      </Text>
    </group>
  );
};

const FlowLine: React.FC<{ link: CryptoLink; nodes: CryptoNode[] }> = ({ link, nodes }) => {
  const sourceNode = nodes.find(n => n.id === link.source);
  const targetNode = nodes.find(n => n.id === link.target);
  
  if (!sourceNode || !targetNode) return null;

  const points = [
    new THREE.Vector3(...sourceNode.position),
    new THREE.Vector3(...targetNode.position)
  ];

  return (
    <Line
      points={points}
      color={link.color}
      lineWidth={Math.max(1, link.value / 1000)}
      transparent
      opacity={0.6}
    />
  );
};

const Scene: React.FC<{ nodes: CryptoNode[]; links: CryptoLink[] }> = ({ nodes, links }) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 20);
  }, [camera]);

  const handleNodeClick = (node: CryptoNode) => {
    console.log('Clicked node:', node);
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Nodes */}
      {nodes.map((node) => (
        <CryptoSphere
          key={node.id}
          node={node}
          onClick={handleNodeClick}
        />
      ))}

      {/* Links */}
      {links.map((link, index) => (
        <FlowLine
          key={`${link.source}-${link.target}-${index}`}
          link={link}
          nodes={nodes}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={50}
        minDistance={5}
      />
    </>
  );
};

export const ThreeJSVisualization: React.FC<ThreeJSVisualizationProps> = ({
  nodes,
  links,
  width,
  height
}) => {
  const canvasStyle = useMemo(() => ({
    width: `${width}px`,
    height: `${height}px`,
    background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
  }), [width, height]);

  return (
    <div style={canvasStyle}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene nodes={nodes} links={links} />
      </Canvas>
    </div>
  );
};

export default ThreeJSVisualization;

