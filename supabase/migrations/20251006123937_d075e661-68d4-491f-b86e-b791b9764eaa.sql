-- Grant admin role to prof.rafaelfuso@gmail.com
-- First, we need to find the user_id for this email
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user_id from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'prof.rafaelfuso@gmail.com'
  LIMIT 1;
  
  -- If user exists, grant admin role
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role (using ON CONFLICT to avoid duplicates)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user %', admin_user_id;
  ELSE
    RAISE NOTICE 'User with email prof.rafaelfuso@gmail.com not found';
  END IF;
END $$;