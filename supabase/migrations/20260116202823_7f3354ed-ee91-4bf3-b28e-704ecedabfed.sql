-- Create table for smart money alerts
CREATE TABLE public.smart_money_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('whale_movement', 'exchange_outflow', 'exchange_inflow', 'accumulation', 'distribution', 'smart_money_buy', 'smart_money_sell')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user alert preferences
CREATE TABLE public.user_alert_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  min_severity TEXT NOT NULL DEFAULT 'medium' CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
  alert_types TEXT[] DEFAULT ARRAY['whale_movement', 'exchange_outflow', 'smart_money_buy']::TEXT[],
  watchlist_only BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_money_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for smart_money_alerts
CREATE POLICY "Users can view their own alerts"
ON public.smart_money_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.smart_money_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.smart_money_alerts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
ON public.smart_money_alerts FOR INSERT
WITH CHECK (true);

-- Policies for user_alert_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_alert_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_alert_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_alert_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_smart_money_alerts_user_id ON public.smart_money_alerts(user_id);
CREATE INDEX idx_smart_money_alerts_created_at ON public.smart_money_alerts(created_at DESC);
CREATE INDEX idx_smart_money_alerts_is_read ON public.smart_money_alerts(is_read);
CREATE INDEX idx_smart_money_alerts_symbol ON public.smart_money_alerts(symbol);

-- Trigger for updated_at on preferences
CREATE OR REPLACE FUNCTION public.update_alert_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_alert_preferences_updated_at
BEFORE UPDATE ON public.user_alert_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_alert_preferences_updated_at();