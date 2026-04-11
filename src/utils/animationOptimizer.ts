/**
 * AnimationOptimizer — coordena todas as animações D3 do app.
 * CORREÇÕES: 30fps (era 60), Visibility API, DOMBatcher via microtask.
 */

export class AnimationOptimizer {
  private frameId: number | null = null;
  private isRunning = false;
  private lastTime = 0;
  private callbacks: Set<(deltaTime: number, timestamp: number) => void> = new Set();
  private readonly TARGET_FPS     = 30;
  private readonly FRAME_INTERVAL = 1000 / 30;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.pause(); }
      else if (this.callbacks.size > 0) { this.resume(); }
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime  = performance.now();
    this.frameId   = requestAnimationFrame(this.animate);
  }

  stop() {
    this.isRunning = false;
    if (this.frameId !== null) { cancelAnimationFrame(this.frameId); this.frameId = null; }
  }

  private pause() { if (this.frameId !== null) { cancelAnimationFrame(this.frameId); this.frameId = null; } }
  private resume() { if (!this.isRunning) return; this.lastTime = performance.now(); this.frameId = requestAnimationFrame(this.animate); }

  addCallback(cb: (dt: number, ts: number) => void) {
    this.callbacks.add(cb);
    if (!this.isRunning) this.start();
  }
  removeCallback(cb: (dt: number, ts: number) => void) {
    this.callbacks.delete(cb);
    if (this.callbacks.size === 0) this.stop();
  }

  private animate = (ts: number) => {
    if (!this.isRunning) return;
    const delta = ts - this.lastTime;
    if (delta >= this.FRAME_INTERVAL) {
      this.callbacks.forEach(cb => { try { cb(delta, ts); } catch(e) { console.warn('[animator]', e); } });
      this.lastTime = ts - (delta % this.FRAME_INTERVAL);
    }
    this.frameId = requestAnimationFrame(this.animate);
  };
}

export const globalAnimator = new AnimationOptimizer();

export class SmoothInterpolator {
  private current: number; private target: number; private speed: number;
  constructor(initial = 0, speed = 0.1) { this.current = initial; this.target = initial; this.speed = speed; }
  setTarget(v: number) { this.target = v; }
  update(dt: number): number {
    const diff = this.target - this.current;
    if (Math.abs(diff) > 0.001) { this.current += diff * this.speed * (dt / 16.67); } else { this.current = this.target; }
    return this.current;
  }
  getCurrentValue() { return this.current; }
}

export class ObjectPool<T> {
  private pool: T[] = [];
  constructor(private createFn: () => T, private resetFn: (o: T) => void, n = 10) {
    for (let i = 0; i < n; i++) this.pool.push(createFn());
  }
  get(): T { return this.pool.pop() ?? this.createFn(); }
  release(o: T) { this.resetFn(o); this.pool.push(o); }
}

export class DOMBatcher {
  private ops: (() => void)[] = [];
  private scheduled = false;
  add(op: () => void) {
    this.ops.push(op);
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => { this.ops.forEach(f => f()); this.ops.length = 0; this.scheduled = false; });
    }
  }
}
export const domBatcher = new DOMBatcher();
