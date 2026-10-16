CREATE TABLE public.market_candles (
  symbol text NOT NULL,
  timeframe text NOT NULL,
  open_time timestamptz NOT NULL,
  open numeric NOT NULL, high numeric NOT NULL, low numeric NOT NULL, close numeric NOT NULL,
  quote_volume numeric NOT NULL,
  source text NOT NULL DEFAULT 'binance_spot',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, timeframe, open_time)
);
GRANT SELECT ON public.market_candles TO anon, authenticated;
GRANT ALL ON public.market_candles TO service_role;
ALTER TABLE public.market_candles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read candles" ON public.market_candles FOR SELECT USING (true);

CREATE TABLE public.market_derivatives (
  symbol text NOT NULL,
  timeframe text NOT NULL,
  ts timestamptz NOT NULL,
  open_interest numeric,
  open_interest_usd numeric,
  funding_rate numeric,
  source text NOT NULL DEFAULT 'binance_futures',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, timeframe, ts)
);
GRANT SELECT ON public.market_derivatives TO anon, authenticated;
GRANT ALL ON public.market_derivatives TO service_role;
ALTER TABLE public.market_derivatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read derivatives" ON public.market_derivatives FOR SELECT USING (true);