// ========== LEVEL OF DETAIL (LOD) MANAGER ==========
// Adjusts visual complexity based on zoom, performance, and device capabilities

export interface LODLevel {
  name: string;
  particleCount: number;
  particleSize: number;
  trailLength: number;
  glowIntensity: number;
  updateInterval: number;  // ms between updates
  enableBlur: boolean;
  enableGlow: boolean;
  enableTrails: boolean;
  maxNodes: number;
  maxLinks: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  lastUpdate: number;
}

// ========== LOD LEVELS ==========
export const LOD_LEVELS: Record<string, LODLevel> = {
  ultra: {
    name: 'ultra',
    particleCount: 15,
    particleSize: 3,
    trailLength: 8,
    glowIntensity: 1.0,
    updateInterval: 16,  // 60fps
    enableBlur: true,
    enableGlow: true,
    enableTrails: true,
    maxNodes: 100,
    maxLinks: 200,
  },
  high: {
    name: 'high',
    particleCount: 12,
    particleSize: 3,
    trailLength: 6,
    glowIntensity: 0.8,
    updateInterval: 16,
    enableBlur: true,
    enableGlow: true,
    enableTrails: true,
    maxNodes: 75,
    maxLinks: 150,
  },
  medium: {
    name: 'medium',
    particleCount: 12,
    particleSize: 3,
    trailLength: 5,
    glowIntensity: 0.5,
    updateInterval: 33,  // 30fps
    enableBlur: false,
    enableGlow: true,
    enableTrails: true,
    maxNodes: 50,
    maxLinks: 100,
  },
  low: {
    name: 'low',
    particleCount: 6,
    particleSize: 2.5,
    trailLength: 0,
    glowIntensity: 0.3,
    updateInterval: 50,  // 20fps
    enableBlur: false,
    enableGlow: false,
    enableTrails: false,
    maxNodes: 30,
    maxLinks: 60,
  },
  minimal: {
    name: 'minimal',
    particleCount: 3,
    particleSize: 2,
    trailLength: 0,
    glowIntensity: 0,
    updateInterval: 100,  // 10fps
    enableBlur: false,
    enableGlow: false,
    enableTrails: false,
    maxNodes: 20,
    maxLinks: 40,
  },
};

// ========== LOD MANAGER CLASS ==========
export class LODManager {
  private currentLevel: LODLevel;
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16,
    lastUpdate: 0,
  };
  private frameTimeSamples: number[] = [];
  private sampleSize = 30;
  private lastFrameTime = 0;
  private autoAdjust = true;
  private zoom = 1;
  private listeners: Set<(level: LODLevel) => void> = new Set();

  constructor(initialLevel: keyof typeof LOD_LEVELS = 'medium') {
    this.currentLevel = LOD_LEVELS[initialLevel];
    this.detectDeviceCapabilities();
  }

  // Detect device capabilities and set initial LOD
  private detectDeviceCapabilities(): void {
    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency || 4;

    // Check device memory (if available)
    const memory = (navigator as any).deviceMemory || 4;

    // Determine initial LOD based on device
    if (isMobile) {
      this.currentLevel = memory < 4 ? LOD_LEVELS.minimal : LOD_LEVELS.low;
    } else if (cores < 4 || memory < 4) {
      this.currentLevel = LOD_LEVELS.medium;
    } else if (cores >= 8 && memory >= 8) {
      this.currentLevel = LOD_LEVELS.ultra;
    } else {
      this.currentLevel = LOD_LEVELS.high;
    }

    console.log(`[LOD] Initial level: ${this.currentLevel.name} (cores: ${cores}, memory: ${memory}GB, mobile: ${isMobile})`);
  }

  // Record frame time for FPS calculation
  recordFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimeSamples.push(frameTime);
      
      if (this.frameTimeSamples.length > this.sampleSize) {
        this.frameTimeSamples.shift();
      }
      
      // Calculate average FPS
      const avgFrameTime = this.frameTimeSamples.reduce((a, b) => a + b, 0) / this.frameTimeSamples.length;
      this.metrics.fps = Math.round(1000 / avgFrameTime);
      this.metrics.frameTime = avgFrameTime;
      this.metrics.lastUpdate = now;
      
      // Auto-adjust LOD based on performance
      if (this.autoAdjust && this.frameTimeSamples.length >= this.sampleSize) {
        this.adjustLOD();
      }
    }
    
    this.lastFrameTime = now;
  }

  // Auto-adjust LOD based on performance
  private adjustLOD(): void {
    const currentIndex = Object.keys(LOD_LEVELS).indexOf(this.currentLevel.name);
    const levels = Object.values(LOD_LEVELS);
    
    // If FPS is too low, reduce quality
    if (this.metrics.fps < 25 && currentIndex < levels.length - 1) {
      this.setLevel(levels[currentIndex + 1].name as keyof typeof LOD_LEVELS);
      console.log(`[LOD] Reducing quality to ${this.currentLevel.name} (FPS: ${this.metrics.fps})`);
    }
    // Quality upgrades removed — only degrade to avoid frame-rate yo-yo
    // (users can manually set LOD if needed)

    // Reset samples after adjustment
    this.frameTimeSamples = [];
  }

  // Set zoom level (affects LOD)
  setZoom(zoom: number): void {
    this.zoom = zoom;
    
    // Reduce quality at high zoom out
    if (zoom < 0.5 && this.currentLevel.name === 'ultra') {
      this.setLevel('high');
    } else if (zoom < 0.3 && this.currentLevel.name !== 'low' && this.currentLevel.name !== 'minimal') {
      this.setLevel('medium');
    }
  }

  // Manually set LOD level
  setLevel(level: keyof typeof LOD_LEVELS): void {
    if (this.currentLevel.name !== level) {
      this.currentLevel = LOD_LEVELS[level];
      this.notifyListeners();
    }
  }

  // Enable/disable auto-adjustment
  setAutoAdjust(enabled: boolean): void {
    this.autoAdjust = enabled;
  }

  // Get current LOD settings
  getLevel(): LODLevel {
    return this.currentLevel;
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get adjusted particle count based on zoom
  getParticleCount(): number {
    // Reduce particles when zoomed out
    if (this.zoom < 0.5) {
      return Math.floor(this.currentLevel.particleCount * 0.5);
    }
    return this.currentLevel.particleCount;
  }

  // Get adjusted settings for current state
  getAdjustedSettings(): LODLevel {
    const adjusted = { ...this.currentLevel };
    
    // Reduce particles when zoomed out
    if (this.zoom < 0.5) {
      adjusted.particleCount = Math.floor(adjusted.particleCount * 0.5);
      adjusted.trailLength = Math.floor(adjusted.trailLength * 0.5);
    }
    
    return adjusted;
  }

  // Subscribe to LOD changes
  subscribe(callback: (level: LODLevel) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of LOD change
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentLevel));
  }
}

// ========== SINGLETON INSTANCE ==========
export const lodManager = new LODManager();

// ========== REACT HOOK ==========
import { useState, useEffect } from 'react';

export function useLOD() {
  const [level, setLevel] = useState<LODLevel>(lodManager.getLevel());
  const [metrics, setMetrics] = useState<PerformanceMetrics>(lodManager.getMetrics());

  useEffect(() => {
    const unsubscribe = lodManager.subscribe(setLevel);
    
    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(lodManager.getMetrics());
    }, 1000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    level,
    metrics,
    setLevel: (l: keyof typeof LOD_LEVELS) => lodManager.setLevel(l),
    setZoom: (z: number) => lodManager.setZoom(z),
    setAutoAdjust: (enabled: boolean) => lodManager.setAutoAdjust(enabled),
    recordFrame: () => lodManager.recordFrame(),
  };
}
