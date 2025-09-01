-- supabase/migrations/20250901130000_initial_schema.sql

-- Create custom types
CREATE TYPE public.app_permission AS ENUM ('read', 'write', 'delete');
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create crypto_price_action_signals table
CREATE TABLE IF NOT EXISTS public.crypto_price_action_signals (
    symbol TEXT PRIMARY KEY,
    explosive_potential TEXT,
    is_breakout BOOLEAN,
    is_expansion BOOLEAN,
    is_accelerating BOOLEAN,
    volume_anomaly BOOLEAN,
    price_momentum BOOLEAN,
    social_buzz BOOLEAN,
    whale_activity BOOLEAN,
    technical_breakout BOOLEAN,
    confidence_score NUMERIC,
    prediction_horizon TEXT,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create predictive_signals table
CREATE TABLE IF NOT EXISTS public.predictive_signals (
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    confidence NUMERIC,
    strength NUMERIC,
    factors TEXT[],
    risk_level TEXT,
    target_gain NUMERIC,
    timeframe TEXT,
    phase TEXT,
    volume_anomaly BOOLEAN,
    smart_money_flow TEXT,
    support_level NUMERIC,
    volume_profile TEXT,
    rsi_divergence BOOLEAN,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (symbol, signal_type)
);

-- Create crypto_onchain_metrics table
CREATE TABLE IF NOT EXISTS public.crypto_onchain_metrics (
    symbol TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    active_addresses INTEGER,
    new_wallets INTEGER,
    whale_movements INTEGER,
    dormant_wakeups INTEGER,
    exchange_inflow NUMERIC,
    exchange_outflow NUMERIC,
    net_flow NUMERIC,
    large_transactions INTEGER,
    exchange_net_flow NUMERIC, -- Added for CoinGlass data
    PRIMARY KEY (symbol, timestamp)
);

-- Create tradingview_symbol_map table
CREATE TABLE IF NOT EXISTS public.tradingview_symbol_map (
    coingecko_id TEXT PRIMARY KEY,
    tradingview_symbol TEXT NOT NULL
);
