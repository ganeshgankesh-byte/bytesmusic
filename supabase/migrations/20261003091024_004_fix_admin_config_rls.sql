-- Enable RLS on admin_config and restrict access to admin only.
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_config" ON admin_config;
CREATE POLICY "admin_read_config" ON admin_config FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_config" ON admin_config;
CREATE POLICY "admin_insert_config" ON admin_config FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_config" ON admin_config;
CREATE POLICY "admin_update_config" ON admin_config FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_config" ON admin_config;
CREATE POLICY "admin_delete_config" ON admin_config FOR DELETE
  TO authenticated USING (is_admin());

-- Restrict is_admin() execution to authenticated users only.
-- anon doesn't need it since all public tables use USING(true) for SELECT.
REVOKE EXECUTE ON FUNCTION is_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;