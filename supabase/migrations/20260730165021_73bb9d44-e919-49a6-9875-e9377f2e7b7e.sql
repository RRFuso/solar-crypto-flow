CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_smart_money_flow_cache_expires_at
  ON public.smart_money_flow_cache (expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_money_flow_cache_last_updated
  ON public.smart_money_flow_cache (last_updated DESC);

SELECT cron.unschedule('smart-money-tracker-1h')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-money-tracker-1h');

SELECT cron.unschedule('smart-money-tracker-24h')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smart-money-tracker-24h');

SELECT cron.schedule(
  'smart-money-tracker-1h',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bahshstcztvqmxiubslx.supabase.co/functions/v1/smart-money-tracker',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "update_flows", "timeframe": "1h"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'smart-money-tracker-24h',
  '7 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bahshstcztvqmxiubslx.supabase.co/functions/v1/smart-money-tracker',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "update_flows", "timeframe": "24h"}'::jsonb
  );
  $$
);