import { useEffect, useRef, useState } from 'react';

export type QualityLevel = 'high' | 'medium' | 'low';

interface PerformanceState {
  fps: number;
  quality: QualityLevel;
  /** Recommended cap on rendered nodes (cull beyond this) */
  maxNodes: number;
  /** Recommended cap on visible labels (label virtualization) */
  maxLabels: number;
  /** Whether to render decorative particles/glows */
  showParticles: boolean;
  /** Whether to render link animations */
  animateLinks: boolean;
}

/**
 * Adaptive Level-of-Detail hook.
 * - Measures FPS via rAF
 * - Drops quality when FPS < 40 for sustained period
 * - Restores quality when FPS > 55 for sustained period
 * - manualOverride forces a quality and disables auto-detect
 */
export function usePerformanceLOD(manualOverride?: QualityLevel): PerformanceState {
  const [state, setState] = useState<PerformanceState>({
    fps: 60,
    quality: manualOverride ?? 'high',
    maxNodes: 500,
    maxLabels: 150,
    showParticles: true,
    animateLinks: true,
  });

  const frameCountRef = useRef(0);
  const lastTsRef = useRef(performance.now());
  const lowSamplesRef = useRef(0);
  const highSamplesRef = useRef(0);
  const qualityRef = useRef<QualityLevel>(state.quality);

  useEffect(() => {
    if (manualOverride) {
      qualityRef.current = manualOverride;
      setState(s => ({ ...s, quality: manualOverride, ...qualityPreset(manualOverride) }));
      return;
    }

    let rafId: number;
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTsRef.current;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastTsRef.current = now;

        // Hysteresis: need 3 consecutive bad/good samples to switch
        if (fps < 40) {
          lowSamplesRef.current++;
          highSamplesRef.current = 0;
        } else if (fps > 55) {
          highSamplesRef.current++;
          lowSamplesRef.current = 0;
        } else {
          lowSamplesRef.current = 0;
          highSamplesRef.current = 0;
        }

        let next = qualityRef.current;
        if (lowSamplesRef.current >= 3) {
          next = qualityRef.current === 'high' ? 'medium' : 'low';
          lowSamplesRef.current = 0;
        } else if (highSamplesRef.current >= 5) {
          next = qualityRef.current === 'low' ? 'medium' : 'high';
          highSamplesRef.current = 0;
        }

        if (next !== qualityRef.current) {
          qualityRef.current = next;
          setState({ fps, quality: next, ...qualityPreset(next) });
        } else {
          setState(s => (s.fps === fps ? s : { ...s, fps }));
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [manualOverride]);

  return state;
}

function qualityPreset(q: QualityLevel) {
  // Visual stability: particles and node cap are kept constant across quality
  // levels. Link animation and label budget adapt to FPS.
  switch (q) {
    case 'high':   return { maxNodes: 500, maxLabels: 200, showParticles: true, animateLinks: true  };
    case 'medium': return { maxNodes: 500, maxLabels: 100, showParticles: true, animateLinks: true  };
    case 'low':    return { maxNodes: 500, maxLabels: 50,  showParticles: true, animateLinks: false };
  }
}
