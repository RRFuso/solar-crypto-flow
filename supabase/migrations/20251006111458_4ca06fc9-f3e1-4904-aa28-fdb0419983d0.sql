-- Create storage bucket for crypto logos with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crypto-logos',
  'crypto-logos',
  true,
  1048576, -- 1MB limit per logo
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
);

-- RLS policies for crypto logos bucket (public read, service role write)
CREATE POLICY "Public can view crypto logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'crypto-logos');

CREATE POLICY "Service role can upload crypto logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'crypto-logos' 
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role can update crypto logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'crypto-logos' 
  AND auth.role() = 'service_role'
);

-- Create table to track cached logos
CREATE TABLE IF NOT EXISTS public.cached_crypto_logos (
  symbol TEXT PRIMARY KEY,
  storage_path TEXT NOT NULL,
  source_url TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cached_crypto_logos
ALTER TABLE public.cached_crypto_logos ENABLE ROW LEVEL SECURITY;

-- Public read access to cached logos metadata
CREATE POLICY "Public can view cached logo metadata"
ON public.cached_crypto_logos FOR SELECT
USING (true);

-- Service role can manage cached logos metadata
CREATE POLICY "Service role can manage cached logo metadata"
ON public.cached_crypto_logos FOR ALL
USING (auth.role() = 'service_role');

-- Add cache control headers hint to price history
COMMENT ON TABLE public.crypto_price_history IS 'Historical price data - can be cached for 1 hour';

-- Create index for faster price history queries
CREATE INDEX IF NOT EXISTS idx_crypto_price_history_symbol_timestamp 
ON public.crypto_price_history(symbol, timestamp DESC);