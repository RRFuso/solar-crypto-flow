import React, { useRef, useEffect, useMemo } from 'react';

interface FlowToken {
  symbol: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  size: number;
}

interface FlowData {
  title: string;
  tokens: FlowToken[];
}

const COLORS = {
  bullish: { r: 74, g: 222, b: 128 },   // green
  bearish: { r: 248, g: 113, b: 113 },   // red
  neutral: { r: 156, g: 163, b: 175 },   // gray
  gold: { r: 251, g: 191, b: 36 },       // amber
  sun: { r: 251, g: 146, b: 60 },        // orange
  orbit: { r: 75, g: 85, b: 99 },        // gray-600
  bg: { r: 17, g: 24, b: 39 },           // gray-900
};

interface Particle {
  angle: number;
  speed: number;
  orbitIndex: number;
  size: number;
  color: typeof COLORS.bullish;
  opacity: number;
}

const InlineFlowVisualization: React.FC<{ data: FlowData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const sortedTokens = useMemo(
    () => [...data.tokens].sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow)).slice(0, 8),
    [data.tokens]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sortedTokens.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 320;
    const H = 240;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;
    const minOrbit = 32;
    const orbitStep = Math.min(22, (Math.min(W, H) / 2 - minOrbit - 10) / sortedTokens.length);

    // Generate particles for flow lines
    const particles: Particle[] = [];
    sortedTokens.forEach((token, i) => {
      const count = 3 + Math.round(token.size * 5);
      const color = token.direction === 'bullish' ? COLORS.bullish
                  : token.direction === 'bearish' ? COLORS.bearish
                  : COLORS.neutral;
      for (let p = 0; p < count; p++) {
        const baseSpeed = token.direction === 'bearish' ? -0.008 : 0.008;
        particles.push({
          angle: (p / count) * Math.PI * 2 + Math.random() * 0.3,
          speed: baseSpeed * (0.7 + Math.random() * 0.6) * (0.5 + token.size),
          orbitIndex: i,
          size: 1.2 + token.size * 1.5,
          color,
          opacity: 0.4 + Math.random() * 0.5,
        });
      }
    });

    // Flow lines between connected tokens
    const flowLines: { from: number; to: number; strength: number; color: typeof COLORS.bullish }[] = [];
    for (let i = 0; i < sortedTokens.length - 1; i++) {
      const strength = Math.min(1, (Math.abs(sortedTokens[i].netFlow) + Math.abs(sortedTokens[i + 1].netFlow)) / 
        (Math.max(...sortedTokens.map(t => Math.abs(t.netFlow))) * 2 || 1));
      flowLines.push({
        from: i,
        to: i + 1,
        strength,
        color: sortedTokens[i].direction === 'bullish' ? COLORS.bullish : COLORS.bearish,
      });
    }

    let frame = 0;

    function draw() {
      if (!ctx) return;
      frame++;

      // Background
      ctx.fillStyle = `rgb(${COLORS.bg.r}, ${COLORS.bg.g}, ${COLORS.bg.b})`;
      ctx.fillRect(0, 0, W, H);

      // Draw orbital paths
      sortedTokens.forEach((_, i) => {
        const r = minOrbit + i * orbitStep;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${COLORS.orbit.r}, ${COLORS.orbit.g}, ${COLORS.orbit.b}, 0.25)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Draw flow lines between orbits
      flowLines.forEach(fl => {
        const r1 = minOrbit + fl.from * orbitStep;
        const r2 = minOrbit + fl.to * orbitStep;
        const angle1 = (frame * 0.005 + fl.from * 0.8) % (Math.PI * 2);
        const angle2 = (frame * 0.005 + fl.to * 0.8 + 0.3) % (Math.PI * 2);
        const x1 = cx + Math.cos(angle1) * r1;
        const y1 = cy + Math.sin(angle1) * r1;
        const x2 = cx + Math.cos(angle2) * r2;
        const y2 = cy + Math.sin(angle2) * r2;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${fl.color.r}, ${fl.color.g}, ${fl.color.b}, ${fl.strength * 0.4})`);
        grad.addColorStop(1, `rgba(${fl.color.r}, ${fl.color.g}, ${fl.color.b}, 0.05)`);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        // Curved line
        const mx = (x1 + x2) / 2 + (y2 - y1) * 0.15;
        const my = (y1 + y2) / 2 - (x2 - x1) * 0.15;
        ctx.quadraticCurveTo(mx, my, x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + fl.strength * 1.5;
        ctx.stroke();
      });

      // Draw particles
      particles.forEach(p => {
        p.angle += p.speed;
        const r = minOrbit + p.orbitIndex * orbitStep;
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      // Draw sun
      const sunPulse = 1 + Math.sin(frame * 0.04) * 0.08;
      const sunR = 10 * sunPulse;
      const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2.5);
      sunGrad.addColorStop(0, `rgba(${COLORS.sun.r}, ${COLORS.sun.g}, ${COLORS.sun.b}, 0.9)`);
      sunGrad.addColorStop(0.5, `rgba(${COLORS.gold.r}, ${COLORS.gold.g}, ${COLORS.gold.b}, 0.4)`);
      sunGrad.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
      innerGrad.addColorStop(0, '#fef3c7');
      innerGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Draw token nodes
      sortedTokens.forEach((token, i) => {
        const r = minOrbit + i * orbitStep;
        const baseAngle = -Math.PI / 2 + (i * Math.PI * 2) / sortedTokens.length;
        const orbitalAngle = baseAngle + frame * (0.003 * (token.direction === 'bearish' ? -1 : 1)) / (1 + i * 0.3);
        const x = cx + Math.cos(orbitalAngle) * r;
        const y = cy + Math.sin(orbitalAngle) * r;
        const nodeR = 5 + token.size * 6;

        const color = token.direction === 'bullish' ? COLORS.bullish
                    : token.direction === 'bearish' ? COLORS.bearish
                    : COLORS.neutral;

        // Golden glow for high confidence
        if (token.confidence > 70) {
          const glowPulse = 1 + Math.sin(frame * 0.06 + i) * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, nodeR + 5 * glowPulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${COLORS.gold.r}, ${COLORS.gold.g}, ${COLORS.gold.b}, ${0.5 * glowPulse})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Node body
        const nodeGrad = ctx.createRadialGradient(x - nodeR * 0.3, y - nodeR * 0.3, 0, x, y, nodeR);
        nodeGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`);
        nodeGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
        ctx.beginPath();
        ctx.arc(x, y, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Label
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(token.symbol, x, y + nodeR + 9);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [sortedTokens]);

  return (
    <div className="my-3 rounded-lg border border-border/50 bg-gray-900 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border/30 bg-gradient-to-r from-amber-900/20 to-purple-900/20">
        <h4 className="text-[10px] font-semibold text-amber-300">☀️ {data.title}</h4>
      </div>
      <div className="flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          style={{ width: 320, height: 240 }}
          className="rounded"
        />
      </div>
      {/* Minimal legend */}
      <div className="flex items-center justify-center gap-4 pb-2 px-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[9px] text-muted-foreground">Bullish</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[9px] text-muted-foreground">Bearish</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full border border-amber-400" />
          <span className="text-[9px] text-muted-foreground">👑 &gt;70</span>
        </div>
      </div>
    </div>
  );
};

export default InlineFlowVisualization;
