import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OrbitalNode } from './NodePlacement';

type OrbitalLink = {
  source: OrbitalNode;
  target: OrbitalNode;
  value: number;
  volume?: number;
  percentage: number;
};

interface OrbitalAnimationProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: OrbitalNode[];
  width: number;
  height: number;
  rotationSpeed?: number;
  updateLinksInRealTime?: boolean;
}

// ─── Singleton rAF loop ────────────────────────────────────────────────────
// One global loop drives ALL instances with adaptive throttling.
type TickFn = (ts: number) => void;
const tickCallbacks = new Map<symbol, TickFn>();
let globalRafId: number | null = null;

function globalLoop(ts: number) {
  tickCallbacks.forEach(fn => fn(ts));
  if (tickCallbacks.size > 0) {
    globalRafId = requestAnimationFrame(globalLoop);
  } else {
    globalRafId = null;
  }
}

function registerTick(key: symbol, fn: TickFn) {
  tickCallbacks.set(key, fn);
  if (!globalRafId) {
    globalRafId = requestAnimationFrame(globalLoop);
  }
}

function unregisterTick(key: symbol) {
  tickCallbacks.delete(key);
}
// ──────────────────────────────────────────────────────────────────────────

// ─── Per-node cached factor (avoid log10 every frame) ─────────────────────
const speedFactorCache = new WeakMap<OrbitalNode, number>();
function getSpeedFactor(node: OrbitalNode): number {
  let v = speedFactorCache.get(node);
  if (v === undefined) {
    const mcFactor = Math.max(0.3, Math.min(1.2, Math.log10(node.marketCap || 1) / 9));
    v = 1 / (mcFactor * 0.7);
    speedFactorCache.set(node, v);
  }
  return v;
}
// ──────────────────────────────────────────────────────────────────────────

export const OrbitalAnimationComponent: React.FC<OrbitalAnimationProps> = ({
  svg,
  nodes,
  width,
  height,
  rotationSpeed = 0.00001,
  updateLinksInRealTime = false,
}) => {
  const nodesRef = useRef(nodes);
  const svgRef   = useRef(svg);
  nodesRef.current = nodes;
  svgRef.current   = svg;

  useEffect(() => {
    if (!svg || nodes.length === 0) return;

    const instanceKey = Symbol('orbital-instance');
    // Adaptive FPS: start at 30, degrade to 20 if frames take too long
    let targetFps = 30;
    let frameMs   = 1000 / targetFps;
    let lastTs    = 0;
    let slowFrames = 0;
    let fastFrames = 0;

    const handleVisibility = () => {
      if (document.hidden) {
        unregisterTick(instanceKey);
      } else {
        registerTick(instanceKey, tick);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const tick = (ts: number) => {
      if (ts - lastTs < frameMs) return;
      const frameStart = performance.now();
      lastTs = ts;

      const currentNodes = nodesRef.current;
      const currentSvg   = svgRef.current;
      const cx = width / 2;
      const cy = height / 2;

      // ── Physics: rotation matrix (no sqrt, no atan2) ─────────────────
      // For each node, apply: [x',y'] = R(θ) · [x-cx, y-cy] + [cx,cy]
      // where θ = rotationSpeed * speedFactor. Since θ is tiny (~1e-5),
      // use small-angle approximation: cos≈1 - θ²/2, sin≈θ.
      const len = currentNodes.length;
      for (let i = 0; i < len; i++) {
        const node = currentNodes[i];
        if (node.type === 'central') continue;
        const x = node.x;
        const y = node.y;
        if (x == null || y == null) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy < 1) continue;

        const theta = rotationSpeed * getSpeedFactor(node);
        const sinT = theta;
        const cosT = 1 - theta * theta * 0.5;

        node.x = cx + cosT * dx - sinT * dy;
        node.y = cy + sinT * dx + cosT * dy;
      }

      // ── DOM: single batched D3 write ─────────────────────────────────
      currentSvg.selectAll<SVGGElement, OrbitalNode>('g.node')
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

      // ── Adaptive FPS based on frame cost ─────────────────────────────
      const cost = performance.now() - frameStart;
      if (cost > 16) {
        slowFrames++;
        fastFrames = 0;
        if (slowFrames > 30 && targetFps > 20) {
          targetFps = 20;
          frameMs = 1000 / targetFps;
          slowFrames = 0;
        }
      } else if (cost < 6) {
        fastFrames++;
        slowFrames = 0;
        if (fastFrames > 120 && targetFps < 30) {
          targetFps = 30;
          frameMs = 1000 / targetFps;
          fastFrames = 0;
        }
      }
    };

    registerTick(instanceKey, tick);

    return () => {
      unregisterTick(instanceKey);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, rotationSpeed, updateLinksInRealTime]);

  return null;
};

// Keep legacy class for any import that uses it
export class OrbitalAnimation {
  private key: symbol;
  constructor(props: OrbitalAnimationProps) {
    this.key = Symbol('legacy-orbital');
  }
  cleanup() { unregisterTick(this.key); }
}
