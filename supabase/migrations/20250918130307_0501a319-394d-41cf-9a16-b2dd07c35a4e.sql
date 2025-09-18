-- Create table to store all Binance symbols
CREATE TABLE IF NOT EXISTS public.binance_symbols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  binance_symbol TEXT NOT NULL UNIQUE,
  base_asset TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TRADING',
  is_trading_allowed BOOLEAN NOT NULL DEFAULT true,
  quote_volume_24h NUMERIC DEFAULT 0,
  price_change_percent_24h NUMERIC DEFAULT 0,
  last_price NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.binance_symbols ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access to binance symbols" 
ON public.binance_symbols 
FOR SELECT 
USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage binance symbols" 
ON public.binance_symbols 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_binance_symbols_base_asset ON public.binance_symbols(base_asset);
CREATE INDEX IF NOT EXISTS idx_binance_symbols_volume ON public.binance_symbols(quote_volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_binance_symbols_status ON public.binance_symbols(status);