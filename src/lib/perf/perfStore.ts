// Lightweight perf telemetry pub/sub for the admin Performance Monitor.
// No deps, no React — safe to import from hooks and components.

export interface PerfSnapshot {
  fps: number;
  quality: 'high' | 'medium' | 'low';
  maxNodes: number;
  maxLabels: number;
  showParticles: boolean;
  animateLinks: boolean;
  nodesRendered: number;
  labelsRendered: number;
  linksRendered: number;
  particlesEnabled: boolean;
  lastUpdate: number;
}

const initial: PerfSnapshot = {
  fps: 60,
  quality: 'high',
  maxNodes: 0,
  maxLabels: 0,
  showParticles: false,
  animateLinks: false,
  nodesRendered: 0,
  labelsRendered: 0,
  linksRendered: 0,
  particlesEnabled: false,
  lastUpdate: 0,
};

let snapshot: PerfSnapshot = { ...initial };
const listeners = new Set<(s: PerfSnapshot) => void>();

export function getPerfSnapshot(): PerfSnapshot {
  return snapshot;
}

export function setPerf(patch: Partial<PerfSnapshot>) {
  snapshot = { ...snapshot, ...patch, lastUpdate: Date.now() };
  listeners.forEach(l => l(snapshot));
}

export function subscribePerf(fn: (s: PerfSnapshot) => void): () => void {
  listeners.add(fn);
  fn(snapshot);
  return () => { listeners.delete(fn); };
}
