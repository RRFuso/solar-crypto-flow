-- Fix database functions security by setting proper search_path
-- Update existing functions to have secure search_path

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
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
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Fix log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(_action text, _table_name text DEFAULT NULL::text, _record_id uuid DEFAULT NULL::uuid, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), _action, _table_name, _record_id, _old_values, _new_values
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;