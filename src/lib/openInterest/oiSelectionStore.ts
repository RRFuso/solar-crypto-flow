import type { OITimeframe } from './binanceOI';

/** Shares the chart's current asset + timeframe with the Helius Oracle. */
let selection: { symbol: string; timeframe: OITimeframe } = { symbol: 'BTC', timeframe: '1h' };

export const setOISelection = (s: { symbol: string; timeframe: OITimeframe }) => { selection = s; };
export const getOISelection = () => selection;
