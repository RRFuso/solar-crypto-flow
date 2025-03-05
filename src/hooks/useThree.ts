
import { useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Types for crypto data
interface CryptoNode {
  id: string;
  name: string;
  marketCap: number;
  color: number;
  type: 'blackhole' | 'layer1' | 'token';
  parentId?: string;
}

interface CapitalFlow {
  from: string;
  to: string;
  value: number;
  isInflow: boolean;
}

// Mock data for initial rendering
const mockCryptoData: CryptoNode[] = [
  // Black hole (BTC)
  { id: 'btc', name: 'Bitcoin', marketCap: 100, color: 0x000000, type: 'blackhole' },
  
  // Layer 1 cryptos
  { id: 'eth', name: 'Ethereum', marketCap: 45, color: 0x9b87f5, type: 'layer1' },
  { id: 'sol', name: 'Solana', marketCap: 15, color: 0x00ffaa, type: 'layer1' },
  { id: 'avax', name: 'Avalanche', marketCap: 10, color: 0xff0000, type: 'layer1' },
  
  // Ethereum ecosystem tokens
  { id: 'uni', name: 'Uniswap', marketCap: 5, color: 0xff66cc, type: 'token', parentId: 'eth' },
  { id: 'link', name: 'Chainlink', marketCap: 6, color: 0x0099ff, type: 'token', parentId: 'eth' },
  { id: 'aave', name: 'Aave', marketCap: 4, color: 0x6633ff, type: 'token', parentId: 'eth' },
  
  // Solana ecosystem tokens
  { id: 'ray', name: 'Raydium', marketCap: 2, color: 0x0066ff, type: 'token', parentId: 'sol' },
  { id: 'srm', name: 'Serum', marketCap: 1, color: 0x00ccff, type: 'token', parentId: 'sol' },
  
  // Avalanche ecosystem tokens
  { id: 'joe', name: 'Trader Joe', marketCap: 0.8, color: 0xcc3300, type: 'token', parentId: 'avax' },
  { id: 'avme', name: 'AVME', marketCap: 0.5, color: 0xff6600, type: 'token', parentId: 'avax' },
];

const mockFlowData: CapitalFlow[] = [
  { from: 'btc', to: 'eth', value: 5, isInflow: true },
  { from: 'btc', to: 'sol', value: 8, isInflow: true },
  { from: 'eth', to: 'avax', value: 3, isInflow: true },
  { from: 'sol', to: 'btc', value: 2, isInflow: false },
];

export function useThree() {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let cryptoObjects: Map<string, THREE.Object3D> = new Map();
  let flowObjects: THREE.Object3D[] = [];
  let animationFrameId: number;
  
  // Calculate sizes based on market cap
  const getNodeSize = (marketCap: number, type: CryptoNode['type']) => {
    const baseSize = type === 'blackhole' ? 10 : type === 'layer1' ? 5 : 2;
    return baseSize * Math.sqrt(marketCap) / 5;
  };
  
  // Calculate orbital distance based on type
  const getOrbitalDistance = (type: CryptoNode['type'], index: number) => {
    if (type === 'blackhole') return 0;
    if (type === 'layer1') return 40 + (index * 15);
    return 15; // Distance from parent layer1
  };
  
  // Create a glowing effect for objects
  const createGlowMaterial = (color: number) => {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
  };
  
  // Create crypto object (planet/star)
  const createCryptoObject = (crypto: CryptoNode, index: number) => {
    const size = getNodeSize(crypto.marketCap, crypto.type);
    
    // Create the sphere for the crypto
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = crypto.type === 'blackhole' 
      ? new THREE.MeshBasicMaterial({ color: 0x000000 })
      : createGlowMaterial(crypto.color);
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on type
    if (crypto.type === 'blackhole') {
      mesh.position.set(0, 0, 0);
    } else if (crypto.type === 'layer1') {
      const distance = getOrbitalDistance(crypto.type, index);
      const angle = index * (Math.PI * 2 / mockCryptoData.filter(c => c.type === 'layer1').length);
      mesh.position.x = distance * Math.cos(angle);
      mesh.position.z = distance * Math.sin(angle);
    }
    
    // Add orbit path for layer1 cryptos
    if (crypto.type === 'layer1') {
      const distance = getOrbitalDistance(crypto.type, index);
      const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444444, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);
    }
    
    // Create object group
    const group = new THREE.Group();
    group.add(mesh);
    
    // Add label for larger objects
    if (crypto.type !== 'token') {
      const textSprite = createTextSprite(crypto.name);
      textSprite.position.y = size + 2;
      group.add(textSprite);
    }
    
    return group;
  };
  
  // Create text label
  const createTextSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return new THREE.Sprite();
    
    canvas.width = 256;
    canvas.height = 128;
    
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(text, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 5, 1);
    
    return sprite;
  };
  
  // Create flow line between nodes
  const createFlowLine = (flow: CapitalFlow) => {
    const sourceObject = cryptoObjects.get(flow.from);
    const targetObject = cryptoObjects.get(flow.to);
    
    if (!sourceObject || !targetObject) return null;
    
    const sourcePosition = sourceObject.position;
    const targetPosition = targetObject.position;
    
    // Calculate curve control point
    const midPoint = new THREE.Vector3().lerpVectors(sourcePosition, targetPosition, 0.5);
    const direction = new THREE.Vector3().subVectors(targetPosition, sourcePosition).normalize();
    const perpendicular = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
    
    // Adjust height of control point
    midPoint.y = Math.min(30, sourcePosition.distanceTo(targetPosition) * 0.5);
    
    // Create curved line
    const curve = new THREE.QuadraticBezierCurve3(
      sourcePosition.clone(),
      midPoint,
      targetPosition.clone()
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Line thickness based on flow value
    const lineWidth = Math.max(0.5, Math.min(3, flow.value / 2));
    const color = flow.isInflow ? 0x00ff00 : 0xff0000;
    
    const material = new THREE.LineBasicMaterial({ 
      color: color, 
      linewidth: lineWidth,
      transparent: true,
      opacity: 0.7
    });
    
    return new THREE.Line(geometry, material);
  };
  
  // Initialize Three.js scene
  const init = useCallback((container: HTMLDivElement) => {
    // Reset previous objects if any
    cryptoObjects = new Map();
    flowObjects = [];
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070710);
    
    // Create camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 100, 100);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);
    
    // Create stars background
    createStarsBackground();
    
    // Create crypto objects
    mockCryptoData.forEach((crypto, index) => {
      const object = createCryptoObject(crypto, index);
      scene.add(object);
      cryptoObjects.set(crypto.id, object);
      
      // Position token around its parent
      if (crypto.type === 'token' && crypto.parentId) {
        const parent = cryptoObjects.get(crypto.parentId);
        if (parent) {
          const tokenIndex = mockCryptoData
            .filter(c => c.type === 'token' && c.parentId === crypto.parentId)
            .findIndex(c => c.id === crypto.id);
          
          const tokenCount = mockCryptoData
            .filter(c => c.type === 'token' && c.parentId === crypto.parentId)
            .length;
          
          const angle = tokenIndex * (Math.PI * 2 / tokenCount);
          const distance = getOrbitalDistance(crypto.type, 0);
          
          object.position.x = parent.position.x + distance * Math.cos(angle);
          object.position.z = parent.position.z + distance * Math.sin(angle);
          
          // Add orbit path for tokens
          const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 32);
          const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x222222, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
          });
          const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
          orbit.rotation.x = Math.PI / 2;
          orbit.position.copy(parent.position);
          scene.add(orbit);
        }
      }
    });
    
    // Create flow lines
    mockFlowData.forEach(flow => {
      const flowLine = createFlowLine(flow);
      if (flowLine) {
        scene.add(flowLine);
        flowObjects.push(flowLine);
      }
    });
    
    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return {
      cleanup: () => {
        window.removeEventListener('resize', handleResize);
        container.removeChild(renderer.domElement);
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  // Create starry background
  const createStarsBackground = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  };
  
  // Animation loop
  const animate = useCallback(() => {
    animationFrameId = requestAnimationFrame(animate);
    
    if (!scene || !camera || !renderer || !controls) return;
    
    // Rotate layer1 cryptos around BTC
    const layer1Cryptos = mockCryptoData.filter(c => c.type === 'layer1');
    layer1Cryptos.forEach((crypto, index) => {
      const object = cryptoObjects.get(crypto.id);
      if (object) {
        const angle = Date.now() * 0.0001 + index * (Math.PI * 2 / layer1Cryptos.length);
        const distance = getOrbitalDistance(crypto.type, index);
        
        object.position.x = distance * Math.cos(angle);
        object.position.z = distance * Math.sin(angle);
        
        // Rotate tokens around their layer1 parent
        const tokens = mockCryptoData.filter(c => c.type === 'token' && c.parentId === crypto.id);
        tokens.forEach((token, tokenIndex) => {
          const tokenObject = cryptoObjects.get(token.id);
          if (tokenObject) {
            const tokenAngle = Date.now() * 0.0005 + tokenIndex * (Math.PI * 2 / tokens.length);
            const tokenDistance = getOrbitalDistance('token', 0);
            
            tokenObject.position.x = object.position.x + tokenDistance * Math.cos(tokenAngle);
            tokenObject.position.z = object.position.z + tokenDistance * Math.sin(tokenAngle);
          }
        });
      }
    });
    
    // Update flow lines positions
    mockFlowData.forEach((flow, index) => {
      const sourceObject = cryptoObjects.get(flow.from);
      const targetObject = cryptoObjects.get(flow.to);
      const flowLine = flowObjects[index];
      
      if (sourceObject && targetObject && flowLine) {
        const sourcePosition = sourceObject.position;
        const targetPosition = targetObject.position;
        
        // Calculate curve control point
        const midPoint = new THREE.Vector3().lerpVectors(sourcePosition, targetPosition, 0.5);
        const direction = new THREE.Vector3().subVectors(targetPosition, sourcePosition).normalize();
        const perpendicular = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        
        // Adjust height of control point
        midPoint.y = Math.min(30, sourcePosition.distanceTo(targetPosition) * 0.5);
        
        // Create updated curve
        const curve = new THREE.QuadraticBezierCurve3(
          sourcePosition.clone(),
          midPoint,
          targetPosition.clone()
        );
        
        const points = curve.getPoints(50);
        flowLine.geometry.setFromPoints(points);
      }
    });
    
    controls.update();
    renderer.render(scene, camera);
  }, []);
  
  return { init, animate };
}
