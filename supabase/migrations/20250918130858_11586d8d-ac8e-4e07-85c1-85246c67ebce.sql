-- Enable RLS for ai_watchlist table
ALTER TABLE public.ai_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access to ai watchlist" 
ON public.ai_watchlist 
FOR SELECT 
USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage ai watchlist" 
ON public.ai_watchlist 
FOR ALL 
USING (auth.role() = 'service_role');

-- Fix remaining functions with search_path
CREATE OR REPLACE FUNCTION public.update_predictive_signals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_price_history(p_symbol text, p_start_time timestamp with time zone, p_end_time timestamp with time zone)
 RETURNS SETOF crypto_price_history
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
    BEGIN
        RETURN QUERY
        SELECT
            h.symbol,
            h.timestamp,
            h.open,
            h.high,
            h.low,
            h.close,
            h.volume
        FROM
            public.crypto_price_history h
        WHERE
            h.symbol = p_symbol AND
            h.timestamp >= p_start_time AND
            h.timestamp <= p_end_time
        ORDER BY
            h.timestamp;
    END;
$function$;