
-- 1. Remove permissive UPDATE policy on user_credits
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

-- 2. Create server-side credit consumption RPC
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.user_credits
  SET credits = credits - 1,
      flows_used = flows_used + 1,
      updated_at = now()
  WHERE user_id = uid
    AND credits > 0;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_credit() TO authenticated;

-- 3. Drop dangerous exec() function
DROP FUNCTION IF EXISTS public.exec(text);

-- 4. Restrict smart_money_flow_cache to authenticated users
DROP POLICY IF EXISTS "Public read access" ON public.smart_money_flow_cache;
DROP POLICY IF EXISTS "Anyone can read smart_money_flow_cache" ON public.smart_money_flow_cache;
DROP POLICY IF EXISTS "Allow public read on smart_money_flow_cache" ON public.smart_money_flow_cache;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.smart_money_flow_cache;

CREATE POLICY "Authenticated users can read smart money flow cache"
  ON public.smart_money_flow_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Harden new-user trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_credits (user_id, credits, flows_used, flows_limit)
  VALUES (NEW.id, 30, 0, 30)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
