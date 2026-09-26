import React from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Clock, Minus } from 'lucide-react';
import { useOpenInterest } from '@/hooks/useOpenInterest';
import { OITimeframe } from '@/lib/openInterest/binanceOI';
import { SCENARIO_TEXT } from '@/lib/openInterest/indicators';

interface Props {
  symbol: string;
  timeframe: OITimeframe;
}

const fmtUsd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;
const fmtNum = (n: number) => Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(2);
const tone = (n: number) => (n > 0 ? 'text-green-400' : n < 0 ? 'text-red-400' : 'text-muted-foreground');
const Arrow = ({ n }: { n: number }) =>
  n > 0 ? <ArrowUpRight className="w-3 h-3" /> : n < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />;

const Stat = ({ label, value, sub, n }: { label: string; value: string; sub?: string; n?: number }) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-sm font-semibold flex items-center gap-1 ${n !== undefined ? tone(n) : 'text-foreground'}`}>
      {n !== undefined && <Arrow n={n} />}
      <span className="truncate">{value}</span>
    </div>
    {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
  </div>
);

export const OpenInterestPanel: React.FC<Props> = ({ symbol, timeframe }) => {
  const { data, isLoading, error } = useOpenInterest(symbol, timeframe);

  return (
    <div className="border-t border-border px-4 py-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">Open Interest · {symbol.toUpperCase()} · {timeframe.toUpperCase()}</span>
        {data && (
          <span className={`flex items-center gap-1 ${data.isStale ? 'text-yellow-400' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            {new Date(data.lastTime).toLocaleString('pt-BR')}
            {data.isStale && ' · atrasado'}
          </span>
        )}
      </div>

      {isLoading && <div className="text-muted-foreground">Carregando Open Interest...</div>}
      {error && <div className="text-muted-foreground">OI indisponível: {(error as Error).message}</div>}
      {!isLoading && !error && !data && <div className="text-muted-foreground">Histórico insuficiente para calcular indicadores.</div>}

      {data && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Stat label="OI atual" value={fmtUsd(data.oiValueCurrent)} sub={`${fmtNum(data.oiCurrent)} contratos`} />
            <Stat label="Δ% vela" value={`${data.oiDeltaPct.toFixed(2)}%`} n={data.oiDeltaPct} sub={`${data.oiZScore.toFixed(1)}σ`} />
            <Stat label="OI Delta" value={fmtNum(data.oiDelta)} n={data.oiDelta} />
            <Stat label={`Período (${data.samples})`} value={`${data.oiPeriodPct.toFixed(2)}%`} n={data.oiPeriodPct} sub={fmtNum(data.oiPeriodAbs)} />
            <Stat label="Momentum" value={`${data.oiMomentum.toFixed(2)} p.p.`} n={data.oiMomentum} />
            <Stat
              label="OI / Volume"
              value={data.oiToVolume !== null ? `${data.oiToVolume.toFixed(1)}×` : 'n/d'}
              sub={data.fundingRate !== null ? `Funding ${(data.fundingRate * 100).toFixed(4)}%` : 'Funding n/d'}
            />
          </div>

          <div className="mt-2 rounded-md bg-muted/40 px-2 py-1.5">
            <span className="font-semibold text-foreground">{SCENARIO_TEXT[data.scenario].title}</span>
            <span className="text-muted-foreground"> — preço {data.priceChangePct.toFixed(2)}%. {SCENARIO_TEXT[data.scenario].desc}</span>
          </div>

          {data.anomalies.length > 0 && (
            <ul className="mt-2 space-y-1">
              {data.anomalies.map((a, i) => (
                <li key={i} className={`flex items-start gap-1 ${a.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {a.message}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-1 text-[10px] text-muted-foreground">
            Fonte: Binance Futures. Liquidações indisponíveis. Indicadores informativos, sem garantia de movimento futuro.
          </div>
        </>
      )}
    </div>
  );
};

export default OpenInterestPanel;
