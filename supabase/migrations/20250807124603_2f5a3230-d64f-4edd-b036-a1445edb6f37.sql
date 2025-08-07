-- Create table for storing real-time crypto price action signals
CREATE TABLE IF NOT EXISTS public.crypto_price_action_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  explosive_potential NUMERIC DEFAULT 0,
  volume_anomaly BOOLEAN DEFAULT false,
  price_momentum BOOLEAN DEFAULT false,
  social_buzz BOOLEAN DEFAULT false,
  whale_activity BOOLEAN DEFAULT false,
  technical_breakout BOOLEAN DEFAULT false,
  confidence_score NUMERIC DEFAULT 0,
  prediction_horizon TEXT DEFAULT '4h',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(symbol)
);

-- Create table for on-chain metrics
CREATE TABLE IF NOT EXISTS public.crypto_onchain_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  contract_address TEXT,
  chain TEXT DEFAULT 'ethereum',
  active_addresses INTEGER DEFAULT 0,
  new_wallets INTEGER DEFAULT 0,
  whale_movements INTEGER DEFAULT 0,
  dormant_wakeups INTEGER DEFAULT 0,
  exchange_inflow NUMERIC DEFAULT 0,
  exchange_outflow NUMERIC DEFAULT 0,
  net_flow NUMERIC DEFAULT 0,
  large_transactions INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(symbol, timestamp)
);

-- Create table for social sentiment metrics
CREATE TABLE IF NOT EXISTS public.crypto_social_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  sentiment_score NUMERIC DEFAULT 0, -- -1 to 1
  mention_volume INTEGER DEFAULT 0,
  twitter_mentions INTEGER DEFAULT 0,
  reddit_mentions INTEGER DEFAULT 0,
  telegram_mentions INTEGER DEFAULT 0,
  sentiment_change_24h NUMERIC DEFAULT 0,
  fear_greed_index NUMERIC DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(symbol, timestamp)
);

-- Create table for technical indicators
CREATE TABLE IF NOT EXISTS public.crypto_technical_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT DEFAULT '4h',
  rsi NUMERIC DEFAULT 0,
  macd_line NUMERIC DEFAULT 0,
  macd_signal NUMERIC DEFAULT 0,
  macd_histogram NUMERIC DEFAULT 0,
  bollinger_upper NUMERIC DEFAULT 0,
  bollinger_middle NUMERIC DEFAULT 0,
  bollinger_lower NUMERIC DEFAULT 0,
  ema_12 NUMERIC DEFAULT 0,
  ema_26 NUMERIC DEFAULT 0,
  sma_20 NUMERIC DEFAULT 0,
  volume_sma NUMERIC DEFAULT 0,
  atr NUMERIC DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Enable RLS on all tables
ALTER TABLE public.crypto_price_action_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_onchain_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_technical_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is market data)
CREATE POLICY "Allow public read access to price action signals" 
ON public.crypto_price_action_signals FOR SELECT USING (true);

CREATE POLICY "Allow public read access to onchain metrics" 
ON public.crypto_onchain_metrics FOR SELECT USING (true);

CREATE POLICY "Allow public read access to social metrics" 
ON public.crypto_social_metrics FOR SELECT USING (true);

CREATE POLICY "Allow public read access to technical indicators" 
ON public.crypto_technical_indicators FOR SELECT USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_signals_symbol_timestamp ON public.crypto_price_action_signals(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_onchain_symbol_timestamp ON public.crypto_onchain_metrics(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_social_symbol_timestamp ON public.crypto_social_metrics(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_technical_symbol_timeframe_timestamp ON public.crypto_technical_indicators(symbol, timeframe, timestamp);