-- supabase/migrations/20250914120000_create_crypto_price_history.sql

CREATE TABLE IF NOT EXISTS public.crypto_price_history (
    symbol TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,
    PRIMARY KEY (symbol, timestamp)
);

CREATE OR REPLACE FUNCTION public.get_price_history(
    p_symbol TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
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
$$;