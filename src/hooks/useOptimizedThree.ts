import { useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  FrustumCuller,
  InstancedParticleSystem,
  InstancedFlowRenderer,
  PerformanceMonitor,
  MemoryOptimizer,
  LODManager,
} from '@/utils/ThreeJSOptimizer';

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
  color?: number;
  speed?: number;
}

interface OptimizedThreeConfig {
  enableLOD?: boolean;
  enableFrustumCulling?: boolean;
  enableInstancedParticles?: boolean;
  maxParticles?: number;
  maxFlowInstances?: number;
  adaptiveQuality?: boolean;
}

const DEFAULT_CONFIG: OptimizedThreeConfig = {
  enableLOD: true,
  enableFrustumCulling: true,
  enableInstancedParticles: true,
  maxParticles: 1000,
  maxFlowInstances: 500,
  adaptiveQuality: true,
};

export function useOptimizedThree(config: OptimizedThreeConfig = {}) {
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const animationFrameRef = useRef<number>();
  
  // Optimization systems
  const frustumCullerRef = useRef<FrustumCuller>();
  const particleSystemRef = useRef<InstancedParticleSystem>();
  const flowRendererRef = useRef<InstancedFlowRenderer>();
  const performanceMonitorRef = useRef<PerformanceMonitor>();
  const memoryOptimizerRef = useRef<MemoryOptimizer>();
  const lodManagerRef = useRef<LODManager>();
  
  // Object tracking
  const cryptoObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const activeFlowsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const accretionDiskRef = useRef<THREE.Mesh>();
  
  // Quality settings
  const qualityLevelRef = useRef<'high' | 'medium' | 'low'>('high');

  // Create LOD versions of crypto objects
  const createLODCryptoObject = useCallback((crypto: CryptoNode, index: number): THREE.LOD => {
    const baseSize = crypto.type === 'blackhole' ? 10 : crypto.type === 'layer1' ? 5 : 2;
    const size = baseSize * Math.sqrt(crypto.marketCap) / 5;

    // High detail
    const highGeometry = new THREE.SphereGeometry(size, 32, 32);
    const highMaterial = new THREE.MeshStandardMaterial({
      color: crypto.color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: crypto.color,
      emissiveIntensity: crypto.type === 'layer1' ? 0.5 : 0.2,
    });
    const highDetail = new THREE.Mesh(highGeometry, highMaterial);

    // Medium detail
    const medGeometry = new THREE.SphereGeometry(size, 16, 16);
    const medMaterial = new THREE.MeshBasicMaterial({ color: crypto.color });
    const mediumDetail = new THREE.Mesh(medGeometry, medMaterial);

    // Low detail
    const lowGeometry = new THREE.SphereGeometry(size, 8, 8);
    const lowMaterial = new THREE.MeshBasicMaterial({ color: crypto.color });
    const lowDetail = new THREE.Mesh(lowGeometry, lowMaterial);

    const lod = new THREE.LOD();
    lod.addLevel(highDetail, 0);
    lod.addLevel(mediumDetail, 50);
    lod.addLevel(lowDetail, 100);

    return lod;
  }, []);

  // Create optimized accretion disk
  const createOptimizedAccretionDisk = useCallback((size: number): THREE.Mesh => {
    const quality = qualityLevelRef.current;
    const segments = quality === 'high' ? 100 : quality === 'medium' ? 50 : 25;
    
    const geometry = new THREE.TorusGeometry(size * 3, size / 2, 16, segments);
    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
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
          float r = length(vUv - vec2(0.5));
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float swirl = sin(angle * 10.0 + time * 2.0) * 0.5 + 0.5;
          vec3 color1 = vec3(1.0, 0.8, 0.0);
          vec3 color2 = vec3(1.0, 0.3, 0.0);
          vec3 finalColor = mix(color1, color2, swirl);
          float opacity = smoothstep(0.8, 0.2, abs(r - 0.5));
          gl_FragColor = vec4(finalColor, opacity * 0.7);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const disk = new THREE.Mesh(geometry, material);
    disk.rotation.x = Math.PI / 2;
    return disk;
  }, []);

  // Initialize optimized scene
  const init = useCallback((container: HTMLDivElement, cryptoData: CryptoNode[], flowData: CapitalFlow[]) => {
    const cfg = configRef.current;
    
    // Initialize optimization systems
    frustumCullerRef.current = new FrustumCuller();
    particleSystemRef.current = new InstancedParticleSystem(cfg.maxParticles);
    flowRendererRef.current = new InstancedFlowRenderer(cfg.maxFlowInstances);
    memoryOptimizerRef.current = new MemoryOptimizer();
    lodManagerRef.current = LODManager.getInstance();
    
    // Performance monitor with adaptive quality
    performanceMonitorRef.current = new PerformanceMonitor((fps) => {
      if (cfg.adaptiveQuality) {
        if (fps < 25) {
          qualityLevelRef.current = 'low';
        } else if (fps < 45) {
          qualityLevelRef.current = 'medium';
        } else {
          qualityLevelRef.current = 'high';
        }
      }
    });

    // Create scene
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x070710);

    // Create camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current.position.set(0, 80, 100);

    // Create renderer with optimizations
    rendererRef.current = new THREE.WebGLRenderer({
      antialias: qualityLevelRef.current !== 'low',
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current.toneMappingExposure = 1.2;
    container.appendChild(rendererRef.current.domElement);

    // Add controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.minDistance = 30;
    controlsRef.current.maxDistance = 200;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(100, 100, 100);
    sceneRef.current.add(directionalLight);

    const blackHoleLight = new THREE.PointLight(0xff9900, 1.5, 100);
    blackHoleLight.position.set(0, 0, 0);
    sceneRef.current.add(blackHoleLight);

    // Create stars background (using instanced mesh for performance)
    createStarsBackground();

    // Create crypto objects with LOD
    let layer1Index = 0;
    cryptoData.forEach((crypto, index) => {
      const object = cfg.enableLOD 
        ? createLODCryptoObject(crypto, index)
        : createSimpleCryptoObject(crypto);
      
      if (crypto.type === 'blackhole') {
        object.position.set(0, 0, 0);
        
        // Add accretion disk
        accretionDiskRef.current = createOptimizedAccretionDisk(10);
        sceneRef.current!.add(accretionDiskRef.current);
      } else if (crypto.type === 'layer1') {
        const distance = 40 + layer1Index * 15;
        const layer1Count = cryptoData.filter(c => c.type === 'layer1').length;
        const angle = layer1Index * (Math.PI * 2 / layer1Count);
        object.position.x = distance * Math.cos(angle);
        object.position.z = distance * Math.sin(angle);
        layer1Index++;
        
        // Add orbit ring
        const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
          color: 0x444444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        sceneRef.current!.add(orbit);
      }

      sceneRef.current!.add(object);
      cryptoObjectsRef.current.set(crypto.id, object);
      memoryOptimizerRef.current!.register(object);
    });

    // Position tokens around their parents
    cryptoData.filter(c => c.type === 'token').forEach((crypto, tokenIndex) => {
      const parent = cryptoObjectsRef.current.get(crypto.parentId || '');
      const object = cryptoObjectsRef.current.get(crypto.id);
      
      if (parent && object) {
        const siblingTokens = cryptoData.filter(c => c.type === 'token' && c.parentId === crypto.parentId);
        const angle = tokenIndex * (Math.PI * 2 / siblingTokens.length);
        const distance = 15;
        
        object.position.x = parent.position.x + distance * Math.cos(angle);
        object.position.z = parent.position.z + distance * Math.sin(angle);
      }
    });

    // Add instanced particle system to scene
    sceneRef.current.add(particleSystemRef.current.getMesh());
    sceneRef.current.add(flowRendererRef.current.getMesh());

    // Setup flow lines using instanced renderer
    flowData.forEach((flow, index) => {
      const source = cryptoObjectsRef.current.get(flow.from);
      const target = cryptoObjectsRef.current.get(flow.to);
      
      if (source && target) {
        const points = createCurvePoints(source.position, target.position);
        const color = new THREE.Color(flow.isInflow ? 0x00ff00 : 0xff0000);
        flowRendererRef.current!.addFlow(`flow_${index}`, points, color, flow.speed || 0.5);
      }
    });

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current!.aspect = newWidth / newHeight;
      cameraRef.current!.updateProjectionMatrix();
      rendererRef.current!.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Update performance monitor
      performanceMonitorRef.current?.update();

      // Update frustum culler
      if (cfg.enableFrustumCulling && cameraRef.current) {
        frustumCullerRef.current!.update(cameraRef.current);
      }

      // Update LOD
      if (cfg.enableLOD && cameraRef.current) {
        lodManagerRef.current?.updateAll(cameraRef.current);
      }

      // Update accretion disk
      if (accretionDiskRef.current) {
        const material = accretionDiskRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.time.value = time * 0.001;
        }
        accretionDiskRef.current.rotation.z += 0.001;
      }

      // Update orbital positions
      let l1Index = 0;
      cryptoObjectsRef.current.forEach((obj, id) => {
        const crypto = cryptoData.find(c => c.id === id);
        if (crypto?.type === 'layer1') {
          const distance = Math.sqrt(obj.position.x ** 2 + obj.position.z ** 2);
          const currentAngle = Math.atan2(obj.position.z, obj.position.x);
          const speed = 0.0002 / (l1Index + 1);
          const newAngle = currentAngle + speed;
          
          obj.position.x = distance * Math.cos(newAngle);
          obj.position.z = distance * Math.sin(newAngle);
          l1Index++;
        }
      });

      // Update instanced systems
      particleSystemRef.current?.update(deltaTime);
      flowRendererRef.current?.update(deltaTime);

      // Update controls
      controlsRef.current?.update();

      // Render
      if (sceneRef.current && cameraRef.current) {
        rendererRef.current?.render(sceneRef.current, cameraRef.current);
      }
    };

    animate(0);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      particleSystemRef.current?.dispose();
      flowRendererRef.current?.dispose();
      memoryOptimizerRef.current?.disposeAll();
      
      rendererRef.current?.dispose();
      container.removeChild(rendererRef.current!.domElement);
    };
  }, [createLODCryptoObject, createOptimizedAccretionDisk]);

  // Helper: Create simple crypto object (fallback for low quality)
  const createSimpleCryptoObject = (crypto: CryptoNode): THREE.Mesh => {
    const baseSize = crypto.type === 'blackhole' ? 10 : crypto.type === 'layer1' ? 5 : 2;
    const size = baseSize * Math.sqrt(crypto.marketCap) / 5;
    
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: crypto.color });
    return new THREE.Mesh(geometry, material);
  };

  // Helper: Create stars background using instanced mesh
  const createStarsBackground = () => {
    const starCount = 2000;
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stars = new THREE.InstancedMesh(geometry, material, starCount);
    
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 200 + Math.random() * 100;
      
      dummy.position.setFromSphericalCoords(radius, phi, theta);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    
    stars.instanceMatrix.needsUpdate = true;
    sceneRef.current?.add(stars);
  };

  // Helper: Create curve points for flows
  const createCurvePoints = (start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] => {
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
    midPoint.y = Math.min(30, start.distanceTo(end) * 0.5);
    
    const curve = new THREE.QuadraticBezierCurve3(start.clone(), midPoint, end.clone());
    return curve.getPoints(20);
  };

  // Add particle at position
  const addParticle = useCallback((position: THREE.Vector3, color: THREE.Color, velocity: THREE.Vector3) => {
    particleSystemRef.current?.addParticle({
      position: position.clone(),
      color,
      velocity,
      size: 0.5 + Math.random() * 0.5,
    });
  }, []);

  // Update flow color/speed
  const updateFlow = useCallback((flowId: string, color: THREE.Color, speed: number) => {
    const source = cryptoObjectsRef.current.get(flowId.split('_')[0]);
    const target = cryptoObjectsRef.current.get(flowId.split('_')[1]);
    
    if (source && target && flowRendererRef.current) {
      flowRendererRef.current.removeFlow(flowId);
      const points = createCurvePoints(source.position, target.position);
      flowRendererRef.current.addFlow(flowId, points, color, speed);
    }
  }, []);

  // Get current FPS
  const getFPS = useCallback(() => {
    return performanceMonitorRef.current?.getFPS() || 60;
  }, []);

  // Get quality level
  const getQualityLevel = useCallback(() => {
    return qualityLevelRef.current;
  }, []);

  return {
    init,
    addParticle,
    updateFlow,
    getFPS,
    getQualityLevel,
    cryptoObjects: cryptoObjectsRef.current,
  };
}
