-- Migration: 023_enable_rls_profiles
-- Description: Enable RLS on career_id.profiles - users can only access their own profile
-- Date: 2026-02-19

ALTER TABLE career_id.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON career_id.profiles FOR SELECT
  USING (jss_user_id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON career_id.profiles FOR INSERT
  WITH CHECK (jss_user_id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON career_id.profiles FOR UPDATE
  USING (jss_user_id = auth.uid())
  WITH CHECK (jss_user_id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON career_id.profiles FOR DELETE
  USING (jss_user_id = auth.uid());
