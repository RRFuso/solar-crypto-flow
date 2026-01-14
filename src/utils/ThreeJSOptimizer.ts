import * as THREE from 'three';

// ========== LOD (Level of Detail) Manager ==========
export class LODManager {
  private static instance: LODManager;
  private lodLevels: Map<string, THREE.LOD> = new Map();
  
  static getInstance(): LODManager {
    if (!LODManager.instance) {
      LODManager.instance = new LODManager();
    }
    return LODManager.instance;
  }

  createLODObject(id: string, options: {
    highDetail: THREE.Object3D;
    mediumDetail: THREE.Object3D;
    lowDetail: THREE.Object3D;
    distances?: [number, number, number];
  }): THREE.LOD {
    const lod = new THREE.LOD();
    const distances = options.distances || [0, 50, 100];

    lod.addLevel(options.highDetail, distances[0]);
    lod.addLevel(options.mediumDetail, distances[1]);
    lod.addLevel(options.lowDetail, distances[2]);

    this.lodLevels.set(id, lod);
    return lod;
  }

  updateAll(camera: THREE.Camera): void {
    this.lodLevels.forEach(lod => {
      lod.update(camera);
    });
  }

  dispose(): void {
    this.lodLevels.clear();
  }
}

// ========== Frustum Culler ==========
export class FrustumCuller {
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();
  
  update(camera: THREE.Camera): void {
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  isVisible(object: THREE.Object3D): boolean {
    if (object instanceof THREE.Mesh && object.geometry) {
      const boundingSphere = object.geometry.boundingSphere;
      if (!boundingSphere) {
        object.geometry.computeBoundingSphere();
      }
      
      if (object.geometry.boundingSphere) {
        const center = object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
        return this.frustum.containsPoint(center);
      }
    }
    
    return true;
  }

  filterVisible(objects: THREE.Object3D[]): THREE.Object3D[] {
    return objects.filter(obj => this.isVisible(obj));
  }
}

// ========== Instanced Particle System ==========
export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class InstancedParticleSystem {
  private mesh: THREE.InstancedMesh;
  private particles: ParticleData[] = [];
  private maxParticles: number;
  private dummy = new THREE.Object3D();
  private colorAttribute: THREE.InstancedBufferAttribute;
  
  constructor(maxParticles: number = 1000) {
    this.maxParticles = maxParticles;
    
    // Create optimized geometry
    const geometry = new THREE.CircleGeometry(0.5, 8);
    
    // Create shader material for GPU-accelerated animation
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute vec3 instanceColor;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = instanceColor;
          vAlpha = 1.0;
          
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Setup color attribute
    const colors = new Float32Array(maxParticles * 3);
    this.colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
    geometry.setAttribute('instanceColor', this.colorAttribute);
    
    // Initialize all instances as invisible
    for (let i = 0; i < maxParticles; i++) {
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  addParticle(data: Omit<ParticleData, 'life' | 'maxLife'> & { maxLife?: number }): void {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particle
      this.particles.shift();
    }
    
    this.particles.push({
      ...data,
      life: 0,
      maxLife: data.maxLife || 2,
    });
  }

  update(deltaTime: number): void {
    const material = this.mesh.material as THREE.ShaderMaterial;
    material.uniforms.time.value += deltaTime;
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life += deltaTime;
      
      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update position
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
    }

    // Update instance matrices
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const particle = this.particles[i];
        const lifeRatio = particle.life / particle.maxLife;
        const scale = particle.size * (1 - lifeRatio * 0.5);
        
        this.dummy.position.copy(particle.position);
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        
        // Update color
        this.colorAttribute.setXYZ(i, particle.color.r, particle.color.g, particle.color.b);
      } else {
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.particles = [];
  }
}

// ========== Optimized Flow Line Renderer ==========
export class InstancedFlowRenderer {
  private mesh: THREE.InstancedMesh;
  private maxInstances: number;
  private dummy = new THREE.Object3D();
  private activeFlows: Map<string, {
    curvePoints: THREE.Vector3[];
    color: THREE.Color;
    speed: number;
    progress: number;
  }> = new Map();
  
  constructor(maxInstances: number = 500) {
    this.maxInstances = maxInstances;
    
    // Small sphere for flow particles
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    
    this.mesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Initialize invisible
    for (let i = 0; i < maxInstances; i++) {
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  addFlow(id: string, curvePoints: THREE.Vector3[], color: THREE.Color, speed: number): void {
    this.activeFlows.set(id, {
      curvePoints,
      color,
      speed,
      progress: Math.random(), // Stagger start positions
    });
  }

  removeFlow(id: string): void {
    this.activeFlows.delete(id);
  }

  update(deltaTime: number): void {
    let instanceIndex = 0;
    
    this.activeFlows.forEach((flow) => {
      flow.progress += flow.speed * deltaTime;
      if (flow.progress > 1) flow.progress = 0;
      
      // Create particles along the flow
      const particlesPerFlow = Math.min(5, Math.floor(this.maxInstances / this.activeFlows.size));
      
      for (let p = 0; p < particlesPerFlow && instanceIndex < this.maxInstances; p++) {
        const t = (flow.progress + p / particlesPerFlow) % 1;
        const pointIndex = Math.floor(t * (flow.curvePoints.length - 1));
        const nextIndex = Math.min(pointIndex + 1, flow.curvePoints.length - 1);
        const localT = (t * (flow.curvePoints.length - 1)) % 1;
        
        const position = new THREE.Vector3().lerpVectors(
          flow.curvePoints[pointIndex],
          flow.curvePoints[nextIndex],
          localT
        );
        
        this.dummy.position.copy(position);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(instanceIndex, this.dummy.matrix);
        this.mesh.setColorAt(instanceIndex, flow.color);
        
        instanceIndex++;
      }
    });
    
    // Hide unused instances
    for (let i = instanceIndex; i < this.maxInstances; i++) {
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.activeFlows.clear();
  }
}

// ========== Performance Monitor ==========
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private onFPSUpdate?: (fps: number) => void;
  
  constructor(onFPSUpdate?: (fps: number) => void) {
    this.onFPSUpdate = onFPSUpdate;
  }

  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      this.onFPSUpdate?.(this.fps);
    }
  }

  getFPS(): number {
    return this.fps;
  }

  shouldReduceQuality(): boolean {
    return this.fps < 30;
  }
}

// ========== Memory Optimizer ==========
export class MemoryOptimizer {
  private disposables: Set<THREE.Object3D> = new Set();

  register(object: THREE.Object3D): void {
    this.disposables.add(object);
  }

  unregister(object: THREE.Object3D): void {
    this.disposables.delete(object);
  }

  disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    this.unregister(object);
  }

  disposeAll(): void {
    this.disposables.forEach(obj => this.disposeObject(obj));
    this.disposables.clear();
  }

  getMemoryUsage(): { geometries: number; textures: number } {
    return {
      geometries: this.disposables.size,
      textures: 0, // Could be enhanced to track textures
    };
  }
}

// Export singleton instances
export const lodManager = LODManager.getInstance();
export const memoryOptimizer = new MemoryOptimizer();
