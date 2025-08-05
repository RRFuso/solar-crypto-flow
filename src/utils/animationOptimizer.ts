/**
 * Otimizador de performance para animações D3
 * Reduz o "salto" das partículas e melhora a fluidez
 */

import * as d3 from 'd3';

export class AnimationOptimizer {
  private frameId: number | null = null;
  private isRunning = false;
  private lastTime = 0;
  private callbacks: Set<(deltaTime: number, timestamp: number) => void> = new Set();
  
  private targetFPS = 60;
  private frameInterval = 1000 / this.targetFPS;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  addCallback(callback: (deltaTime: number, timestamp: number) => void) {
    this.callbacks.add(callback);
  }

  removeCallback(callback: (deltaTime: number, timestamp: number) => void) {
    this.callbacks.delete(callback);
  }

  private animate = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Limitar FPS para evitar consumo excessivo
    if (deltaTime >= this.frameInterval) {
      this.callbacks.forEach(callback => {
        try {
          callback(deltaTime, currentTime);
        } catch (error) {
          console.warn('Animation callback error:', error);
        }
      });
      
      this.lastTime = currentTime - (deltaTime % this.frameInterval);
    }

    this.frameId = requestAnimationFrame(this.animate);
  };
}

// Instância global para coordenar todas as animações
export const globalAnimator = new AnimationOptimizer();

/**
 * Sistema de interpolação suave para eliminar "saltos"
 */
export class SmoothInterpolator {
  private currentValue: number;
  private targetValue: number;
  private speed: number;

  constructor(initialValue: number = 0, speed: number = 0.1) {
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.speed = speed;
  }

  setTarget(value: number) {
    this.targetValue = value;
  }

  update(deltaTime: number): number {
    const diff = this.targetValue - this.currentValue;
    if (Math.abs(diff) > 0.001) {
      // Interpolação exponencial suave
      this.currentValue += diff * this.speed * (deltaTime / 16.67); // Normalizado para 60fps
    } else {
      this.currentValue = this.targetValue;
    }
    return this.currentValue;
  }

  getCurrentValue(): number {
    return this.currentValue;
  }
}

/**
 * Pool de objetos para reutilização e melhor performance
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pré-alocar objetos
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

/**
 * Batching de operações DOM para melhor performance
 */
export class DOMBatcher {
  private operations: (() => void)[] = [];
  private isScheduled = false;

  add(operation: () => void) {
    this.operations.push(operation);
    this.schedule();
  }

  private schedule() {
    if (this.isScheduled) return;
    this.isScheduled = true;
    
    requestAnimationFrame(() => {
      // Executar todas as operações em lote
      this.operations.forEach(op => op());
      this.operations.length = 0;
      this.isScheduled = false;
    });
  }
}

export const domBatcher = new DOMBatcher();