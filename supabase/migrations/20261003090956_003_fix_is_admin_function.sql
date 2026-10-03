-- Fix is_admin() to correctly extract email from JWT.
-- The previous version used `auth.jwt() -> 'email' ->> 'verified_email'`
-- which treats `email` as a JSON object — but in the Supabase JWT,
-- `email` is a top-level string. This made is_admin() always return false,
-- blocking all admin write operations through RLS.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = (
      SELECT value FROM admin_config WHERE key = 'admin_email'
    ),
    false
  );
$$;