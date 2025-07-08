import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';
import { getLogoUrls } from '@/lib/cryptoLogos';

interface MarketFlowVisualizationGPUProps {
  flowData: FlowData[];
  predictions: Prediction[];
  zoomLevel: number;
  chartTimeframe: string;
  activeCategory: string;
  showLines: boolean;
}

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  prediction?: Prediction;
  logoUrl?: string;
  angle: number;
  orbitRadius: number;
  rotationSpeed: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  color: string;
}

const calculateNodePosition = (index: number, totalNodes: number, radius: number) => {
  const angle = (index / totalNodes) * Math.PI * 2;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    z: 0,
    angle,
    orbitRadius: radius,
  };
};

const getPredictionColor = (prediction?: Prediction) => {
  if (!prediction) return '#8A9196';
  if (prediction.bullish && prediction.confidence >= 0.7) return '#00FF88';
  if (prediction.bullish) return '#66FF99';
  if (!prediction.bullish && prediction.confidence >= 0.7) return '#FF3366';
  if (!prediction.bullish) return '#FF6666';
  return '#FFCC00';
};

// Componente para renderizar um nó com logo
const CryptoNode: React.FC<{ node: Node; time: number }> = ({ node, time }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  // Carregar textura do logo de forma segura
  useEffect(() => {
    const logoUrls = getLogoUrls(node.id);
    const loader = new THREE.TextureLoader();
    
    const loadTexture = (urls: string[], index = 0): void => {
      if (index >= urls.length) {
        // Se nenhuma URL funcionar, criar uma textura de cor sólida
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = node.color;
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillStyle = 'white';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(node.id, 32, 36);
        }
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        setTexture(fallbackTexture);
        return;
      }
      
      loader.load(
        urls[index],
        (loadedTexture) => {
          loadedTexture.wrapS = loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
          loadedTexture.minFilter = THREE.LinearFilter;
          setTexture(loadedTexture);
        },
        undefined,
        () => loadTexture(urls, index + 1)
      );
    };
    
    loadTexture(logoUrls);
  }, [node.id, node.color]);

  // Animação orbital
  const currentAngle = node.angle + time * node.rotationSpeed;
  const x = node.orbitRadius * Math.cos(currentAngle);
  const y = node.orbitRadius * Math.sin(currentAngle);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotação suave do nó
      meshRef.current.rotation.y += delta * 0.5;
      
      // Atualizar posição orbital
      meshRef.current.position.x = x;
      meshRef.current.position.y = y;
    }
    
    if (glowRef.current) {
      // Sincronizar glow com o nó
      glowRef.current.position.x = x;
      glowRef.current.position.y = y;
      
      // Efeito de pulsação para o glow
      const pulse = 1 + Math.sin(time * 2) * 0.2;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {/* Glow effect */}
      <mesh ref={glowRef} position={[x, y, 0]}>
        <sphereGeometry args={[node.radius * 1.5, 16, 16]} />
        <meshBasicMaterial 
          color={node.color} 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Main node with logo texture or color */}
      <mesh ref={meshRef} position={[x, y, 0]}>
        <sphereGeometry args={[node.radius, 32, 32]} />
        {texture ? (
          <meshStandardMaterial 
            map={texture} 
            transparent
            alphaTest={0.1}
          />
        ) : (
          <meshStandardMaterial 
            color={node.color}
            transparent
            opacity={0.8}
          />
        )}
      </mesh>
      
      {/* Text label */}
      <Text
        position={[x, y - node.radius - 0.8, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.name}
      </Text>
      
      {/* Signal indicators */}
      {node.prediction && (
        <mesh position={[x, y, 0.1]}>
          <ringGeometry args={[node.radius * 1.2, node.radius * 1.4, 32]} />
          <meshBasicMaterial 
            color={node.color} 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

// Componente para partículas animadas
const ParticleSystem: React.FC<{ count: number }> = ({ count }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Posições aleatórias em uma esfera
      const radius = Math.random() * 20 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Velocidades aleatórias
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Atualizar posições com velocidades
        positions[i3] += particles.velocities[i3];
        positions[i3 + 1] += particles.velocities[i3 + 1];
        positions[i3 + 2] += particles.velocities[i3 + 2];
        
        // Resetar partículas que saem dos limites
        const distance = Math.sqrt(
          positions[i3] ** 2 + 
          positions[i3 + 1] ** 2 + 
          positions[i3 + 2] ** 2
        );
        
        if (distance > 25) {
          const radius = Math.random() * 5 + 2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          
          positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i3 + 2] = radius * Math.cos(phi);
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#00b5d8"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Componente para linhas conectoras animadas
const AnimatedLink: React.FC<{ link: Link; nodes: Node[]; time: number }> = ({ link, nodes, time }) => {
  const sourceNode = nodes.find(n => n.id === link.source);
  const targetNode = nodes.find(n => n.id === link.target);

  if (!sourceNode || !targetNode) return null;

  // Calcular posições atuais dos nós
  const sourceAngle = sourceNode.angle + time * sourceNode.rotationSpeed;
  const targetAngle = targetNode.angle + time * targetNode.rotationSpeed;
  
  const sourcePos = new THREE.Vector3(
    sourceNode.orbitRadius * Math.cos(sourceAngle),
    sourceNode.orbitRadius * Math.sin(sourceAngle),
    0
  );
  
  const targetPos = new THREE.Vector3(
    targetNode.orbitRadius * Math.cos(targetAngle),
    targetNode.orbitRadius * Math.sin(targetAngle),
    0
  );

  // Criar curva suave
  const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
  midPoint.z = Math.sin(time * 2) * 0.5; // Animação vertical

  const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  const points = curve.getPoints(50);

  return (
    <Line
      points={points}
      color={link.color}
      lineWidth={Math.max(link.value * 2, 1)}
      transparent
      opacity={0.7}
    />
  );
};

// Componente principal da visualização
const SolarSystemVisualization: React.FC<{
  nodes: Node[];
  links: Link[];
  showLines: boolean;
}> = ({ nodes, links, showLines }) => {
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    setTime(prev => prev + delta);
  });

  return (
    <>
      {/* Fundo estrelado */}
      <ParticleSystem count={200} />
      
      {/* Nó central (Sol) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFA500"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Anéis orbitais */}
      {[5, 8, 12, 16].map((radius, index) => (
        <mesh key={index} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
          <meshBasicMaterial 
            color="#00b5d8" 
            transparent 
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Nós dos tokens */}
      {nodes.map(node => (
        <CryptoNode key={node.id} node={node} time={time} />
      ))}
      
      {/* Linhas conectoras */}
      {showLines && links.map((link, index) => (
        <AnimatedLink key={index} link={link} nodes={nodes} time={time} />
      ))}
    </>
  );
};

export const MarketFlowVisualizationGPU: React.FC<MarketFlowVisualizationGPUProps> = ({
  flowData,
  predictions,
  zoomLevel,
  chartTimeframe,
  activeCategory,
  showLines,
}) => {
  const { nodes, links } = useMemo(() => {
    const uniqueSymbols = new Set<string>();
    flowData.forEach(flow => {
      uniqueSymbols.add(flow.from);
      uniqueSymbols.add(flow.to);
    });

    const symbolsArray = Array.from(uniqueSymbols);
    
    // Distribuir nós em diferentes órbitas
    const orbits = [5, 8, 12, 16];
    const newNodes: Node[] = symbolsArray.map((symbol, index) => {
      const orbitIndex = index % orbits.length;
      const orbitRadius = orbits[orbitIndex];
      const nodesInOrbit = Math.ceil(symbolsArray.length / orbits.length);
      const angleInOrbit = (index / nodesInOrbit) * Math.PI * 2;
      
      const prediction = predictions.find(p => p.symbol === symbol);
      
      return {
        id: symbol,
        name: symbol,
        x: orbitRadius * Math.cos(angleInOrbit),
        y: orbitRadius * Math.sin(angleInOrbit),
        z: 0,
        radius: 0.8,
        color: getPredictionColor(prediction),
        prediction,
        angle: angleInOrbit,
        orbitRadius,
        rotationSpeed: 0.1 / orbitRadius, // Órbitas internas mais rápidas
      };
    });

    const newLinks: Link[] = flowData.map(flow => ({
      source: flow.from,
      target: flow.to,
      value: (flow.amountUSD || flow.value || 1000000) / 1000000,
      color: (flow.flowType === 'inflow' || flow.value > 0) ? '#00FF88' : '#FF3366',
    }));

    return { nodes: newNodes, links: newLinks };
  }, [flowData, predictions]);

  return (
    <div className="w-full h-full bg-black">
      <Canvas 
        camera={{ position: [0, 0, zoomLevel / 3], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 10]} intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={50}
          minDistance={5}
        />

        <SolarSystemVisualization 
          nodes={nodes} 
          links={links} 
          showLines={showLines} 
        />
      </Canvas>
    </div>
  );
};

