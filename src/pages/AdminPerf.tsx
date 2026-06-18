import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribePerf, type PerfSnapshot, getPerfSnapshot } from '@/lib/perf/perfStore';

function qualityColor(q: PerfSnapshot['quality']) {
  return q === 'high' ? 'text-emerald-400' : q === 'medium' ? 'text-amber-400' : 'text-rose-400';
}

function fpsColor(fps: number) {
  return fps >= 55 ? 'text-emerald-400' : fps >= 40 ? 'text-amber-400' : 'text-rose-400';
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? 'text-slate-100'}`}>{value}</div>
    </div>
  );
}

export default function AdminPerf() {
  const [snap, setSnap] = useState<PerfSnapshot>(getPerfSnapshot());
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => subscribePerf(setSnap), []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = getPerfSnapshot();
      setHistory(h => {
        const next = [...h, s.fps];
        return next.length > 60 ? next.slice(-60) : next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stale = snap.lastUpdate === 0 || Date.now() - snap.lastUpdate > 5000;
  const max = Math.max(60, ...history);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Performance Monitor</h1>
            <p className="text-sm text-slate-400">
              Telemetria em tempo real da visualização Solar Core
              {stale && <span className="ml-2 text-amber-400">· sem sinal — abra /app em outra aba</span>}
            </p>
          </div>
          <Link to="/app" className="text-sm text-orange-400 hover:text-orange-300">
            ← Voltar ao app
          </Link>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="FPS" value={snap.fps} accent={fpsColor(snap.fps)} />
          <Stat label="LOD ativo" value={snap.quality.toUpperCase()} accent={qualityColor(snap.quality)} />
          <Stat label="Nós renderizados" value={`${snap.nodesRendered} / ${snap.maxNodes || '∞'}`} />
          <Stat label="Labels visíveis" value={`${snap.labelsRendered} / ${snap.maxLabels || '∞'}`} />
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Links" value={snap.linksRendered} />
          <Stat
            label="Partículas"
            value={snap.particlesEnabled ? 'ON' : 'OFF'}
            accent={snap.particlesEnabled ? 'text-emerald-400' : 'text-slate-500'}
          />
          <Stat
            label="Animações de link"
            value={snap.animateLinks ? 'ON' : 'OFF'}
            accent={snap.animateLinks ? 'text-emerald-400' : 'text-slate-500'}
          />
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500">FPS — últimos 60s</span>
            <span className="text-xs text-slate-500">max ref: 60</span>
          </div>
          <div className="flex h-32 items-end gap-[2px]">
            {Array.from({ length: 60 }).map((_, i) => {
              const v = history[history.length - 60 + i] ?? 0;
              const h = Math.max(2, (v / max) * 100);
              const color = v >= 55 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : v > 0 ? 'bg-rose-500' : 'bg-slate-800';
              return <div key={i} className={`flex-1 rounded-sm ${color}`} style={{ height: `${h}%` }} />;
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-1">
          <div>Última atualização: {snap.lastUpdate ? new Date(snap.lastUpdate).toLocaleTimeString() : '—'}</div>
          <div>Quality presets aplicam-se a labels e animações; partículas e nós permanecem constantes (estabilidade visual).</div>
        </section>
      </div>
    </div>
  );
}
