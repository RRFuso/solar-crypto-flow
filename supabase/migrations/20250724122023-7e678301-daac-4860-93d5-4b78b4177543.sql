-- Atualizar tabela crypto_price_action_signals para suportar sinais preditivos avançados
ALTER TABLE public.crypto_price_action_signals 
ADD COLUMN IF NOT EXISTS factors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_accumulation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_distribution BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accumulation_strength INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS distribution_strength INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whale_activity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS smart_money_sentiment TEXT DEFAULT 'neutral';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_crypto_signals_explosive ON public.crypto_price_action_signals(explosive_potential);
CREATE INDEX IF NOT EXISTS idx_crypto_signals_accumulation ON public.crypto_price_action_signals(is_accumulation);
CREATE INDEX IF NOT EXISTS idx_crypto_signals_distribution ON public.crypto_price_action_signals(is_distribution);
CREATE INDEX IF NOT EXISTS idx_crypto_signals_sentiment ON public.crypto_price_action_signals(smart_money_sentiment);

-- Criar tabela para sinais preditivos agregados
CREATE TABLE IF NOT EXISTS public.predictive_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('explosive_upside', 'accumulation_edge', 'distribution_edge', 'reversal_bottom', 'capitulation_bottom')),
  confidence DECIMAL(3,2) DEFAULT 0.0,
  strength DECIMAL(3,2) DEFAULT 0.0,
  factors TEXT[] DEFAULT '{}',
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  target_gain DECIMAL(5,2) DEFAULT 0.0,
  timeframe TEXT DEFAULT '4h',
  phase TEXT DEFAULT 'early' CHECK (phase IN ('early', 'middle', 'late')),
  volume_anomaly BOOLEAN DEFAULT false,
  smart_money_flow TEXT DEFAULT 'neutral' CHECK (smart_money_flow IN ('in', 'out', 'neutral')),
  support_level DECIMAL(20,8),
  volume_profile TEXT DEFAULT 'normal' CHECK (volume_profile IN ('decreasing', 'spike', 'normal')),
  rsi_divergence BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, signal_type)
);

-- Enable RLS
ALTER TABLE public.predictive_signals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for predictive_signals
CREATE POLICY "Predictive signals are viewable by everyone" 
ON public.predictive_signals 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage predictive signals" 
ON public.predictive_signals 
FOR ALL 
USING (auth.role() = 'service_role');

-- Criar índices para a nova tabela
CREATE INDEX IF NOT EXISTS idx_predictive_signals_symbol ON public.predictive_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_predictive_signals_type ON public.predictive_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_predictive_signals_confidence ON public.predictive_signals(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_predictive_signals_updated ON public.predictive_signals(updated_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_predictive_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_predictive_signals_updated_at
  BEFORE UPDATE ON public.predictive_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_predictive_signals_updated_at();