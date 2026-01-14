-- Create smart_money_wallet_performance table for tracking wallet historical performance
CREATE TABLE public.smart_money_wallet_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  profitable_transactions INTEGER NOT NULL DEFAULT 0,
  profit_ratio NUMERIC NOT NULL DEFAULT 0,
  average_roi NUMERIC NOT NULL DEFAULT 0,
  total_volume_usd NUMERIC NOT NULL DEFAULT 0,
  impact_score NUMERIC NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX idx_wallet_performance_address ON public.smart_money_wallet_performance(wallet_address);
CREATE INDEX idx_wallet_performance_impact ON public.smart_money_wallet_performance(impact_score DESC);

-- Enable Row Level Security
ALTER TABLE public.smart_money_wallet_performance ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access to wallet performance"
ON public.smart_money_wallet_performance
FOR SELECT
USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage wallet performance"
ON public.smart_money_wallet_performance
FOR ALL
USING (auth.role() = 'service_role');

-- Update smart_money_flow_cache to include confidence_score and heuristics
ALTER TABLE public.smart_money_flow_cache 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS whale_transactions_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_gas_price_gwei NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_tx_count INTEGER DEFAULT 0;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_wallet_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_wallet_performance_timestamp
BEFORE UPDATE ON public.smart_money_wallet_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_performance_updated_at();