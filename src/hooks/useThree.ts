
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
  { id: 'eth', name: 'Ethereum', marketCap: 45, color: 0x8B5CF6, type: 'layer1' },
  { id: 'sol', name: 'Solana', marketCap: 15, color: 0x00FFAA, type: 'layer1' },
  { id: 'avax', name: 'Avalanche', marketCap: 10, color: 0xFF3333, type: 'layer1' },
  
  // Ethereum ecosystem tokens
  { id: 'uni', name: 'Uniswap', marketCap: 5, color: 0xD946EF, type: 'token', parentId: 'eth' },
  { id: 'link', name: 'Chainlink', marketCap: 6, color: 0x0EA5E9, type: 'token', parentId: 'eth' },
  { id: 'aave', name: 'Aave', marketCap: 4, color: 0x6633FF, type: 'token', parentId: 'eth' },
  
  // Solana ecosystem tokens
  { id: 'ray', name: 'Raydium', marketCap: 2, color: 0x0066FF, type: 'token', parentId: 'sol' },
  { id: 'srm', name: 'Serum', marketCap: 1, color: 0x00CCFF, type: 'token', parentId: 'sol' },
  
  // Avalanche ecosystem tokens
  { id: 'joe', name: 'Trader Joe', marketCap: 0.8, color: 0xF97316, type: 'token', parentId: 'avax' },
  { id: 'avme', name: 'AVME', marketCap: 0.5, color: 0xFF6600, type: 'token', parentId: 'avax' },
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
  let accretionDisk: THREE.Mesh;
  
  // Create realistic materials based on type
  const createMaterial = (crypto: CryptoNode) => {
    if (crypto.type === 'blackhole') {
      // Black hole is completely black
      return new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 1.0
      });
    } else {
      // For stars (Layer 1) and planets (tokens), create shiny materials
      return new THREE.MeshStandardMaterial({
        color: crypto.color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: crypto.color,
        emissiveIntensity: crypto.type === 'layer1' ? 0.5 : 0.2,
      });
    }
  };
  
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
  
  // Create accretion disk for black hole
  const createAccretionDisk = (blackHoleSize: number) => {
    const diskRadius = blackHoleSize * 3;
    const diskGeometry = new THREE.TorusGeometry(diskRadius, diskRadius/2, 32, 100);
    
    // Create custom shader material for the accretion disk
    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          // Create swirling hot colors for the accretion disk
          float r = length(vUv - vec2(0.5));
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float swirl = sin(angle * 10.0 + time * 2.0) * 0.5 + 0.5;
          
          vec3 color1 = vec3(1.0, 0.8, 0.0); // Yellow
          vec3 color2 = vec3(1.0, 0.3, 0.0); // Orange-red
          
          vec3 finalColor = mix(color1, color2, swirl);
          
          // Fade out at edges
          float opacity = smoothstep(0.8, 0.2, abs(r - 0.5));
          
          gl_FragColor = vec4(finalColor, opacity * 0.7);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    
    return disk;
  };
  
  // Create texture for planets
  const createPlanetTexture = (color: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Fill with base color
    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some noise/texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };
  
  // Create crypto object (planet/star)
  const createCryptoObject = (crypto: CryptoNode, index: number) => {
    const size = getNodeSize(crypto.marketCap, crypto.type);
    
    // Create the sphere for the crypto
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = createMaterial(crypto);
    
    // Add texture for planets and stars
    if (crypto.type !== 'blackhole') {
      const texture = createPlanetTexture(crypto.color);
      if (texture) {
        material.map = texture;
      }
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on type
    if (crypto.type === 'blackhole') {
      mesh.position.set(0, 0, 0);
      
      // Add accretion disk around black hole
      accretionDisk = createAccretionDisk(size);
      scene.add(accretionDisk);
    } else if (crypto.type === 'layer1') {
      const distance = getOrbitalDistance(crypto.type, index);
      const angle = index * (Math.PI * 2 / mockCryptoData.filter(c => c.type === 'layer1').length);
      mesh.position.x = distance * Math.cos(angle);
      mesh.position.z = distance * Math.sin(angle);
    }
    
    // Add atmospheric glow for stars and planets
    if (crypto.type !== 'blackhole') {
      const glowSize = size * 1.3;
      const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: crypto.color,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glow);
    }
    
    // Add orbit path for layer1 cryptos
    if (crypto.type === 'layer1') {
      const distance = getOrbitalDistance(crypto.type, index);
      const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444444, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
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
    
    context.font = 'bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(text, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      depthTest: false
    });
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
    
    // Create curved line with particles
    const curve = new THREE.QuadraticBezierCurve3(
      sourcePosition.clone(),
      midPoint,
      targetPosition.clone()
    );
    
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create particle flow using points
    const particleCount = Math.floor(flow.value * 10);
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount); // Position along curve
      const point = curve.getPoint(t);
      
      particlePositions[i * 3] = point.x;
      particlePositions[i * 3 + 1] = point.y;
      particlePositions[i * 3 + 2] = point.z;
      
      particleSizes[i] = Math.random() * 0.8 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    // Use shaders for animated particles
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(flow.isInflow ? 0x00ff00 : 0xff0000) },
        pointTexture: { value: createParticleTexture() },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        
        void main() {
          // Moving particles along the curve
          float speed = 0.5; // Speed of flow
          
          // Calculate position with offset based on time
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        
        void main() {
          gl_FragColor = vec4(color, 1.0) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });
    
    const particleSystem = new THREE.Points(geometry, particleMaterial);
    
    // Also draw the curve as a line
    const lineWidth = Math.max(0.5, Math.min(3, flow.value / 2));
    const lineColor = flow.isInflow ? 0x00ff00 : 0xff0000;
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      transparent: true,
      opacity: 0.3,
      linewidth: lineWidth
    });
    
    const line = new THREE.Line(geometry.clone(), lineMaterial);
    
    // Group the particle system and line
    const group = new THREE.Group();
    group.add(particleSystem);
    group.add(line);
    
    // Store reference to flow data
    group.userData = { 
      flow, 
      curve,
      particleSystem,
      time: 0
    };
    
    return group;
  };
  
  // Create a circular texture for particles
  const createParticleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    if (!context) return new THREE.Texture();
    
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
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
    camera.position.set(0, 80, 100);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    
    // Add ambient lighting for base illumination
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
    scene.add(ambientLight);
    
    // Add directional light for shadows and definition
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);
    
    // Add point light at black hole position
    const blackHoleLight = new THREE.PointLight(0xff9900, 1.5, 100);
    blackHoleLight.position.set(0, 0, 0);
    scene.add(blackHoleLight);
    
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
      size: 0.7,
      transparent: true,
      opacity: 0.8
    });
    
    const starsVertices = [];
    for (let i = 0; i < 3000; i++) {
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
    
    // Update accretion disk shader time
    if (accretionDisk && accretionDisk.material instanceof THREE.ShaderMaterial) {
      accretionDisk.material.uniforms.time.value += 0.01;
      accretionDisk.rotation.z += 0.002;
    }
    
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
    flowObjects.forEach((flowObject) => {
      const userData = flowObject.userData;
      
      if (userData && userData.flow) {
        const sourceObject = cryptoObjects.get(userData.flow.from);
        const targetObject = cryptoObjects.get(userData.flow.to);
        
        if (sourceObject && targetObject) {
          const sourcePosition = sourceObject.position;
          const targetPosition = targetObject.position;
          
          // Calculate curve control point
          const midPoint = new THREE.Vector3().lerpVectors(sourcePosition, targetPosition, 0.5);
          midPoint.y = Math.min(30, sourcePosition.distanceTo(targetPosition) * 0.5);
          
          // Update curve
          const curve = new THREE.QuadraticBezierCurve3(
            sourcePosition.clone(),
            midPoint,
            targetPosition.clone()
          );
          
          // Update particle positions
          const particleSystem = userData.particleSystem;
          if (particleSystem && particleSystem.geometry instanceof THREE.BufferGeometry) {
            const positions = particleSystem.geometry.attributes.position;
            const particleCount = positions.count;
            
            // Update time
            userData.time = (userData.time || 0) + 0.01;
            const timeOffset = userData.time;
            
            for (let i = 0; i < particleCount; i++) {
              // Calculate position with offset based on particle index and time
              let t = (i / particleCount + timeOffset * 0.1) % 1.0;
              
              // Reverse direction if outflow
              if (!userData.flow.isInflow) {
                t = 1.0 - t;
              }
              
              const point = curve.getPoint(t);
              
              positions.setXYZ(i, point.x, point.y, point.z);
            }
            
            positions.needsUpdate = true;
          }
          
          // Update line positions
          flowObject.children.forEach(child => {
            if (child instanceof THREE.Line) {
              const linePositions = [];
              const linePoints = curve.getPoints(50);
              
              for (const point of linePoints) {
                linePositions.push(point.x, point.y, point.z);
              }
              
              const lineGeometry = new THREE.BufferGeometry();
              lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
              child.geometry.dispose();
              child.geometry = lineGeometry;
            }
          });
        }
      }
    });
    
    controls.update();
    renderer.render(scene, camera);
  }, []);
  
  return { init, animate };
}
