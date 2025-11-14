-- Enable RLS on cached_crypto_logos if not already enabled
ALTER TABLE cached_crypto_logos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cached crypto logos
CREATE POLICY "Allow public read access to cached crypto logos"
ON cached_crypto_logos
FOR SELECT
TO public
USING (true);

-- Allow the cache-crypto-logo function to insert/update logos
CREATE POLICY "Allow service role to manage cached logos"
ON cached_crypto_logos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);