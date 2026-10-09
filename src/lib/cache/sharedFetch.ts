/**
 * Deduplicação de requisições GET (Fase 7): chamadas simultâneas à mesma URL
 * compartilham uma única requisição, e a resposta é reaproveitada por ttlMs.
 * Reduz consumo dos limites gratuitos (CoinGecko/Binance).
 */
const cache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export async function sharedFetchJson<T = any>(url: string, ttlMs = 60_000): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      cache.set(url, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p as Promise<T>;
}

/** Preço BTC em USD (CoinGecko), compartilhado entre componentes. */
export const BTC_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';
