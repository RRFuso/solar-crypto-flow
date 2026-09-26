import { OIRawData, tfMs } from './binanceOI';

export type PriceOIScenario =
  | 'price_up_oi_up'
  | 'price_down_oi_up'
  | 'price_up_oi_down'
  | 'price_down_oi_down'
  | 'flat';

export const SCENARIO_TEXT: Record<PriceOIScenario, { title: string; desc: string }> = {
  price_up_oi_up: {
    title: 'Preço ↑ + OI ↑',
    desc: 'Aumento de posições em aberto durante a alta — compatível com entrada de novas posições (não implica que sejam compradas).',
  },
  price_down_oi_up: {
    title: 'Preço ↓ + OI ↑',
    desc: 'Aumento de posições em aberto durante a queda — compatível com entrada de novas posições (não implica que sejam vendidas).',
  },
  price_up_oi_down: {
    title: 'Preço ↑ + OI ↓',
    desc: 'Redução de posições durante a alta — potencialmente associada ao fechamento de posições vendidas.',
  },
  price_down_oi_down: {
    title: 'Preço ↓ + OI ↓',
    desc: 'Redução de posições durante a queda — potencialmente associada ao fechamento de posições compradas.',
  },
  flat: { title: 'Sem variação relevante', desc: 'Preço e OI dentro da variação normal do timeframe.' },
};

export interface OIAnomaly {
  type: 'atypical_change' | 'abrupt_change' | 'divergence' | 'expansion_with_volume';
  severity: 'medium' | 'high';
  message: string;
}

export interface OIAnalysis {
  symbol: string;
  timeframe: string;
  lastTime: number;
  isStale: boolean;
  samples: number;
  oiCurrent: number;
  oiValueCurrent: number;
  oiDelta: number;          // vs previous candle (contracts)
  oiDeltaPct: number;       // % change vs previous candle
  oiPeriodAbs: number;      // change over loaded window (contracts)
  oiPeriodPct: number;
  oiMomentum: number;       // Δ% now − Δ% previous (acceleration, pp)
  oiToVolume: number | null;// OI notional / candle quote volume
  priceChangePct: number;
  volumeRatio: number | null; // candle volume / median volume
  fundingRate: number | null;
  liquidationsAvailable: false;
  scenario: PriceOIScenario;
  anomalies: OIAnomaly[];
  oiZScore: number;
}

const pct = (a: number, b: number) => (b !== 0 ? ((a - b) / b) * 100 : 0);
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
const std = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
};
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function analyzeOpenInterest(raw: OIRawData): OIAnalysis | null {
  const c = raw.candles;
  if (c.length < 3) return null;

  const last = c[c.length - 1];
  const prev = c[c.length - 2];
  const prev2 = c[c.length - 3];

  // Series of per-candle % changes (adaptive baseline)
  const oiChanges: number[] = [];
  const priceChanges: number[] = [];
  for (let i = 1; i < c.length; i++) {
    oiChanges.push(pct(c[i].oi, c[i - 1].oi));
    priceChanges.push(pct(c[i].close, c[i - 1].close));
  }
  const hist = oiChanges.slice(0, -1); // exclude current candle from baseline
  const priceHist = priceChanges.slice(0, -1);
  const oiStd = std(hist) || 1e-9;
  const oiMean = mean(hist);
  const priceStd = std(priceHist) || 1e-9;

  const oiDeltaPct = oiChanges[oiChanges.length - 1];
  const prevDeltaPct = pct(prev.oi, prev2.oi);
  const priceChangePct = priceChanges[priceChanges.length - 1];
  const oiZ = (oiDeltaPct - oiMean) / oiStd;
  const priceZ = priceChangePct / priceStd;

  // Scenario: moves must exceed 0.5σ of their own history to count
  const oiUp = oiDeltaPct > 0 && Math.abs(oiZ) >= 0.5;
  const oiDown = oiDeltaPct < 0 && Math.abs(oiZ) >= 0.5;
  const pUp = priceChangePct > 0 && Math.abs(priceZ) >= 0.5;
  const pDown = priceChangePct < 0 && Math.abs(priceZ) >= 0.5;
  let scenario: PriceOIScenario = 'flat';
  if (pUp && oiUp) scenario = 'price_up_oi_up';
  else if (pDown && oiUp) scenario = 'price_down_oi_up';
  else if (pUp && oiDown) scenario = 'price_up_oi_down';
  else if (pDown && oiDown) scenario = 'price_down_oi_down';

  const vols = c.slice(0, -1).map(x => x.quoteVolume).filter(v => v > 0);
  const medVol = median(vols);
  const volumeRatio = medVol > 0 ? last.quoteVolume / medVol : null;

  const anomalies: OIAnomaly[] = [];
  if (Math.abs(oiZ) >= 3.5) {
    anomalies.push({
      type: 'abrupt_change',
      severity: 'high',
      message: `${oiDeltaPct > 0 ? 'Aumento' : 'Redução'} abrupta de OI (${oiDeltaPct.toFixed(2)}%, ${oiZ.toFixed(1)}σ).`,
    });
  } else if (Math.abs(oiZ) >= 2.5) {
    anomalies.push({
      type: 'atypical_change',
      severity: 'medium',
      message: `Variação atípica de OI (${oiDeltaPct.toFixed(2)}%, ${oiZ.toFixed(1)}σ do histórico do timeframe).`,
    });
  }

  // Divergence over last N candles: price and OI moving opposite, both beyond their typical window move
  const N = Math.min(10, c.length - 1);
  const winPrice = pct(last.close, c[c.length - 1 - N].close);
  const winOI = pct(last.oi, c[c.length - 1 - N].oi);
  const scale = Math.sqrt(N);
  if (
    Math.sign(winPrice) !== Math.sign(winOI) &&
    Math.abs(winPrice) > priceStd * scale &&
    Math.abs(winOI) > oiStd * scale
  ) {
    anomalies.push({
      type: 'divergence',
      severity: 'medium',
      message: `Divergência nas últimas ${N} velas: preço ${winPrice.toFixed(2)}% vs OI ${winOI.toFixed(2)}%.`,
    });
  }

  if (oiZ >= 2 && volumeRatio !== null && volumeRatio >= 1.5) {
    anomalies.push({
      type: 'expansion_with_volume',
      severity: oiZ >= 3 ? 'high' : 'medium',
      message: `Expansão de OI acompanhada de volume ${volumeRatio.toFixed(1)}× a mediana.`,
    });
  }

  const period = tfMs(raw.timeframe);
  const isStale = Date.now() - last.time > period * 2 + 5 * 60_000;

  return {
    symbol: raw.symbol,
    timeframe: raw.timeframe,
    lastTime: last.time,
    isStale,
    samples: c.length,
    oiCurrent: last.oi,
    oiValueCurrent: last.oiValue,
    oiDelta: last.oi - prev.oi,
    oiDeltaPct,
    oiPeriodAbs: last.oi - c[0].oi,
    oiPeriodPct: pct(last.oi, c[0].oi),
    oiMomentum: oiDeltaPct - prevDeltaPct,
    oiToVolume: last.quoteVolume > 0 ? last.oiValue / last.quoteVolume : null,
    priceChangePct,
    volumeRatio,
    fundingRate: raw.fundingRate,
    liquidationsAvailable: false,
    scenario,
    anomalies,
    oiZScore: oiZ,
  };
}

/** Compact text block for the Helius Oracle context */
export function oiAnalysisToContext(a: OIAnalysis): string {
  const f = (n: number, d = 2) => n.toFixed(d);
  return [
    `OPEN INTEREST ${a.symbol} (Binance Futures, timeframe ${a.timeframe}, última vela fechada ${new Date(a.lastTime).toISOString()}${a.isStale ? ', DADOS ATRASADOS' : ''}):`,
    `- OI atual: ${f(a.oiCurrent, 0)} contratos (~US$ ${f(a.oiValueCurrent / 1e6, 1)}M)`,
    `- OI Delta vs vela anterior: ${f(a.oiDelta, 0)} (${f(a.oiDeltaPct)}%, ${f(a.oiZScore, 1)}σ)`,
    `- Variação no período (${a.samples} velas): ${f(a.oiPeriodPct)}%`,
    `- OI Momentum: ${f(a.oiMomentum)} p.p.`,
    `- Variação de preço na vela: ${f(a.priceChangePct)}%`,
    a.volumeRatio !== null ? `- Volume vs mediana: ${f(a.volumeRatio, 1)}×` : '- Volume: indisponível',
    a.oiToVolume !== null ? `- OI/Volume da vela: ${f(a.oiToVolume, 1)}×` : '',
    a.fundingRate !== null ? `- Funding rate atual: ${f(a.fundingRate * 100, 4)}%` : '- Funding rate: indisponível',
    '- Liquidações: indisponíveis (sem fonte pública confiável)',
    `- Matriz preço×OI: ${SCENARIO_TEXT[a.scenario].title} — ${SCENARIO_TEXT[a.scenario].desc}`,
    a.anomalies.length ? `- Anomalias: ${a.anomalies.map(x => x.message).join(' | ')}` : '- Anomalias: nenhuma',
  ].filter(Boolean).join('\n');
}
