-- Enable RLS for crypto_price_history table
ALTER TABLE public.crypto_price_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access to crypto price history" 
ON public.crypto_price_history 
FOR SELECT 
USING (true);

-- Create policy for service role to manage data
CREATE POLICY "Service role can manage crypto price history" 
ON public.crypto_price_history 
FOR ALL 
USING (auth.role() = 'service_role');

-- Fix function search path for has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Fix function search path for get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1 
      WHEN role = 'moderator' THEN 2 
      ELSE 3 
    END 
  LIMIT 1
$function$;