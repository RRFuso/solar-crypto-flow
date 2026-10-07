-- lovable-cron-fallback-reviewed: existing time-based on-chain polling schedule, only adding auth header; cadence unchanged
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_cron_secret') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'edge_cron_secret', 'Shared secret for pg_cron -> edge function calls');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'edge_cron_secret' AND decrypted_secret = _secret
  )
$$;
REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('smart-money-tracker-1h') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-money-tracker-1h');
  PERFORM cron.unschedule('smart-money-tracker-24h') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-money-tracker-24h');
END $$;

SELECT cron.schedule('smart-money-tracker-1h', '*/15 * * * *', $job$
  SELECT net.http_post(
    url := 'https://bahshstcztvqmxiubslx.supabase.co/functions/v1/smart-money-tracker',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_cron_secret')),
    body := '{"action": "update_flows", "timeframe": "1h"}'::jsonb
  );
$job$);

SELECT cron.schedule('smart-money-tracker-24h', '7 */2 * * *', $job$
  SELECT net.http_post(
    url := 'https://bahshstcztvqmxiubslx.supabase.co/functions/v1/smart-money-tracker',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_cron_secret')),
    body := '{"action": "update_flows", "timeframe": "24h"}'::jsonb
  );
$job$);