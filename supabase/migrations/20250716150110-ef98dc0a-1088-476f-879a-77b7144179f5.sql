-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run populate-crypto-signals every 2 minutes
SELECT cron.schedule(
  'populate-crypto-signals-every-2-minutes',
  '*/2 * * * *', -- every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://bahshstcztvqmxiubslx.supabase.co/functions/v1/populate-crypto-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDk3OTAsImV4cCI6MjA2MzkyNTc5MH0.b1S3ABBoaqa6P63piIF_jJXtf9TAgKv37wf50Q4yBvA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);