-- Tabela de carteiras-chave monitoradas (Smart Money Wallets)
CREATE TABLE public.smart_money_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  label TEXT NOT NULL, -- Ex: "Binance Cold Wallet", "Jump Trading", "Alameda Remnants"
  wallet_type TEXT NOT NULL DEFAULT 'whale', -- whale, institution, exchange, dex, fund
  chain TEXT NOT NULL DEFAULT 'ethereum',
  priority INTEGER NOT NULL DEFAULT 5, -- 1-10, maior = mais importante
  historical_impact_score NUMERIC DEFAULT 0, -- Score baseado em impacto histórico
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, chain)
);

-- Tabela de transações de smart money
CREATE TABLE public.smart_money_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.smart_money_wallets(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  value_usd NUMERIC NOT NULL,
  direction TEXT NOT NULL, -- 'inflow' ou 'outflow' (relativo às exchanges)
  chain TEXT NOT NULL DEFAULT 'ethereum',
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tx_hash, chain)
);

-- Índices para performance
CREATE INDEX idx_smart_money_wallets_priority ON public.smart_money_wallets(priority DESC) WHERE is_active = true;
CREATE INDEX idx_smart_money_wallets_type ON public.smart_money_wallets(wallet_type) WHERE is_active = true;
CREATE INDEX idx_smart_money_transactions_timestamp ON public.smart_money_transactions(timestamp DESC);
CREATE INDEX idx_smart_money_transactions_symbol ON public.smart_money_transactions(token_symbol);
CREATE INDEX idx_smart_money_transactions_wallet ON public.smart_money_transactions(wallet_id);

-- Cache agregado de fluxos (atualizado periodicamente)
CREATE TABLE public.smart_money_flow_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1h', -- 1h, 4h, 24h
  net_flow_usd NUMERIC NOT NULL DEFAULT 0,
  total_inflow_usd NUMERIC NOT NULL DEFAULT 0,
  total_outflow_usd NUMERIC NOT NULL DEFAULT 0,
  whale_tx_count INTEGER NOT NULL DEFAULT 0,
  dominant_direction TEXT NOT NULL DEFAULT 'neutral', -- bullish, bearish, neutral
  flow_intensity NUMERIC NOT NULL DEFAULT 0, -- 0-100
  ema_flow NUMERIC DEFAULT 0, -- EMA suavizada para reduzir ruído
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  UNIQUE(token_symbol, timeframe)
);

CREATE INDEX idx_flow_cache_symbol ON public.smart_money_flow_cache(token_symbol);
CREATE INDEX idx_flow_cache_expires ON public.smart_money_flow_cache(expires_at);

-- Enable RLS
ALTER TABLE public.smart_money_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_money_flow_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Public read access to smart money wallets"
ON public.smart_money_wallets FOR SELECT USING (true);

CREATE POLICY "Public read access to smart money transactions"
ON public.smart_money_transactions FOR SELECT USING (true);

CREATE POLICY "Public read access to smart money flow cache"
ON public.smart_money_flow_cache FOR SELECT USING (true);

-- Políticas de gerenciamento por service role
CREATE POLICY "Service role can manage smart money wallets"
ON public.smart_money_wallets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage smart money transactions"
ON public.smart_money_transactions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage smart money flow cache"
ON public.smart_money_flow_cache FOR ALL USING (auth.role() = 'service_role');

-- Inserir carteiras-chave conhecidas
INSERT INTO public.smart_money_wallets (wallet_address, label, wallet_type, chain, priority, historical_impact_score) VALUES
-- Exchanges principais (para tracking de inflow/outflow)
('0x28c6c06298d514db089934071355e5743bf21d60', 'Binance Hot Wallet', 'exchange', 'ethereum', 10, 95),
('0x21a31ee1afc51d94c2efccaa2092ad1028285549', 'Binance Cold Wallet', 'exchange', 'ethereum', 10, 90),
('0x56eddb7aa87536c09ccc2793473599fd21a8b17f', 'Coinbase Prime', 'exchange', 'ethereum', 10, 88),
('0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', 'Coinbase Commerce', 'exchange', 'ethereum', 9, 85),
('0x267a5240229152364691a751755323ac272a575f', 'Kraken', 'exchange', 'ethereum', 9, 82),
-- Baleias/Instituições conhecidas
('0x40b38765696e3d5d8d9d834d8aad4bb6e418e489', 'Robinhood', 'institution', 'ethereum', 8, 80),
('0x1db92e2eebc8e0c075a02bea49a2935bcd2dfcf4', 'MicroStrategy', 'institution', 'ethereum', 9, 92),
-- Market Makers
('0x8eb8a3b98659cce290402893d0123abb75e3ab28', 'Alameda Remnants', 'fund', 'ethereum', 7, 65),
('0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88', 'Jump Trading', 'institution', 'ethereum', 9, 88),
-- DEX Aggregators (para medir atividade on-chain)
('0x1111111254eeb25477b68fb85ed929f73a960582', '1inch Router', 'dex', 'ethereum', 6, 70),
('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'Uniswap Router', 'dex', 'ethereum', 6, 75)
ON CONFLICT (wallet_address, chain) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_smart_money_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_smart_money_wallets_updated_at
  BEFORE UPDATE ON public.smart_money_wallets
  FOR EACH ROW EXECUTE FUNCTION update_smart_money_updated_at();