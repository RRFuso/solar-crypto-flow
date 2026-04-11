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
// One global loop drives ALL instances. Each instance registers/unregisters
// a tick callback. This prevents N overlapping rAF loops when the component
// re-renders while the previous one is still running.
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
  // Loop stops automatically when map is empty
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
  // Stable refs so the tick closure always reads the latest values
  const nodesRef = useRef(nodes);
  const svgRef   = useRef(svg);
  nodesRef.current = nodes;
  svgRef.current   = svg;

  useEffect(() => {
    if (!svg || nodes.length === 0) return;

    const instanceKey = Symbol('orbital-instance');
    const TARGET_FPS  = 30;
    const FRAME_MS    = 1000 / TARGET_FPS;
    let lastTs        = 0;

    // Pause when tab is hidden — saves ~100% CPU in background
    const handleVisibility = () => {
      if (document.hidden) {
        unregisterTick(instanceKey);
      } else {
        registerTick(instanceKey, tick);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const tick = (ts: number) => {
      if (ts - lastTs < FRAME_MS) return;
      lastTs = ts;

      const currentNodes = nodesRef.current;
      const currentSvg   = svgRef.current;
      const cx = width / 2;
      const cy = height / 2;

      // ── Physics: move orbital nodes ──────────────────────────────────
      const orbital = currentNodes.filter(n => n.type !== 'central');
      orbital.forEach(node => {
        if (!node.x || !node.y) return;
        const dx = node.x - cx;
        const dy = node.y - cy;
        const r  = Math.sqrt(dx * dx + dy * dy);
        if (r < 1) return;
        // Large caps orbit slower — feels more natural
        const mcFactor = Math.max(0.3, Math.min(1.2, Math.log10(node.marketCap || 1) / 9));
        const speed    = rotationSpeed / (mcFactor * 0.7);
        const angle    = Math.atan2(dy, dx) + speed;
        node.x = cx + Math.cos(angle) * r;
        node.y = cy + Math.sin(angle) * r;
      });

      // ── DOM: batch all D3 writes in one pass ─────────────────────────
      // node groups (translate only — no complex attr cascade)
      currentSvg.selectAll<SVGGElement, OrbitalNode>('g.node')
        .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

      // glows follow node coordinates (absolute, not relative to group)
      currentSvg.selectAll<SVGCircleElement, OrbitalNode>('.node-glow')
        .attr('cx', d => d.x ?? 0)
        .attr('cy', d => d.y ?? 0);

      // links (only when explicitly requested — expensive)
      if (updateLinksInRealTime) {
        currentSvg.selectAll<SVGPathElement, OrbitalLink>('path.link-path, path.flow-link')
          .attr('d', d => {
            if (!d?.source?.x || !d?.target?.x) return '';
            const sx = d.source.x, sy = d.source.y;
            const tx = d.target.x, ty = d.target.y;
            const dr = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2) * 1.2;
            return `M${sx},${sy} A${dr},${dr} 0 0,1 ${tx},${ty}`;
          });
      }
    };

    registerTick(instanceKey, tick);

    return () => {
      unregisterTick(instanceKey);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  // svg and nodes identity shouldn't restart the loop — use refs for latest values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, rotationSpeed, updateLinksInRealTime]);

  return null;
};

// Keep legacy class for any import that uses it
export class OrbitalAnimation {
  private key: symbol;
  constructor(props: OrbitalAnimationProps) {
    this.key = Symbol('legacy-orbital');
    // no-op: use OrbitalAnimationComponent instead
  }
  cleanup() { unregisterTick(this.key); }
}
