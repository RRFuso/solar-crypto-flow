-- Create user_profiles table for risk profiling and personalization
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_profile TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  investment_horizon TEXT NOT NULL DEFAULT 'medium' CHECK (investment_horizon IN ('short', 'medium', 'long')),
  preferred_assets TEXT[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  max_position_size NUMERIC DEFAULT 10.0,
  stop_loss_percentage NUMERIC DEFAULT 5.0,
  take_profit_percentage NUMERIC DEFAULT 15.0,
  enable_notifications BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'important' CHECK (notification_frequency IN ('all', 'important', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create sentiment_data table for caching sentiment analysis
CREATE TABLE IF NOT EXISTS public.sentiment_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('news', 'social', 'mixed')),
  sentiment_score NUMERIC NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  volume INTEGER DEFAULT 0,
  confidence NUMERIC DEFAULT 0.0,
  key_topics TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_sentiment_symbol_analyzed ON public.sentiment_data(symbol, analyzed_at DESC);

-- Enable RLS
ALTER TABLE public.sentiment_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access to sentiment data"
  ON public.sentiment_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage sentiment data"
  ON public.sentiment_data FOR ALL
  USING (auth.role() = 'service_role');

-- Create ai_predictions table for ML predictions
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '4h',
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('price', 'volatility', 'breakout', 'reversal')),
  predicted_value NUMERIC,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  prediction_horizon TEXT NOT NULL CHECK (prediction_horizon IN ('1h', '4h', '24h', '7d', '30d')),
  features JSONB DEFAULT '{}',
  model_version TEXT DEFAULT 'v1',
  risk_score NUMERIC DEFAULT 0.0,
  supporting_factors TEXT[] DEFAULT '{}',
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_predictions_symbol_valid ON public.ai_predictions(symbol, valid_until DESC);

-- Enable RLS
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access to AI predictions"
  ON public.ai_predictions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage AI predictions"
  ON public.ai_predictions FOR ALL
  USING (auth.role() = 'service_role');

-- Create user_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'favorite', 'trade', 'alert')),
  symbol TEXT,
  category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_interactions_user_time ON public.user_interactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update user_profiles updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Create function to initialize user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to initialize profile on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();