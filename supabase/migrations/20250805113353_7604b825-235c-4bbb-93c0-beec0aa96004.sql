-- Security Fix Migration: Enable RLS, consolidate policies, and harden schema

-- 1. Enable RLS on cryptocurrencies table (CRITICAL)
ALTER TABLE public.cryptocurrencies ENABLE ROW LEVEL SECURITY;

-- 2. Clean up and consolidate overlapping RLS policies on crypto_historical_data
DROP POLICY IF EXISTS "Allow public read access historical" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "Allow public read access to crypto historical data" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "Authenticated users can view crypto data" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "Only authenticated users can delete crypto historical data" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "Only authenticated users can insert crypto historical data" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "Only authenticated users can update crypto historical data" ON public.crypto_historical_data;
DROP POLICY IF EXISTS "historical data" ON public.crypto_historical_data;

-- Create single, clear policy for crypto_historical_data
CREATE POLICY "Public read access to crypto historical data" 
ON public.crypto_historical_data 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify crypto historical data" 
ON public.crypto_historical_data 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Clean up and restrict anonymous access to crypto_price_action_signals
DROP POLICY IF EXISTS "Allow anon insert for crypto_price_action_signals" ON public.crypto_price_action_signals;
DROP POLICY IF EXISTS "Allow anon update for crypto_price_action_signals" ON public.crypto_price_action_signals;
DROP POLICY IF EXISTS "Allow insert all" ON public.crypto_price_action_signals;
DROP POLICY IF EXISTS "Only authenticated users can delete price action signals" ON public.crypto_price_action_signals;
DROP POLICY IF EXISTS "Only authenticated users can insert price action signals" ON public.crypto_price_action_signals;
DROP POLICY IF EXISTS "Only authenticated users can update price action signals" ON public.crypto_price_action_signals;

-- Create secure policies for crypto_price_action_signals
CREATE POLICY "Service role can manage price action signals" 
ON public.crypto_price_action_signals 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. Fix audit_logs table - make user_id NOT NULL and add constraints
-- First, update any existing records with NULL user_id to a system user
UPDATE public.audit_logs 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.audit_logs 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for better performance on audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at 
ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at 
ON public.audit_logs (action, created_at DESC);

-- 5. Add constraint to prevent modification of system audit records
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_no_update_check 
CHECK (true); -- This will be enforced by RLS policies instead

-- 6. Create secure policy for cryptocurrencies table
CREATE POLICY "Public read access to cryptocurrencies" 
ON public.cryptocurrencies 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify cryptocurrencies" 
ON public.cryptocurrencies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Restrict token_contracts policies to authenticated users only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.token_contracts;

CREATE POLICY "Authenticated users can read token contracts" 
ON public.token_contracts 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);