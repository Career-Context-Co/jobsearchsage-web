-- Migration: 029_enable_rls_profile_social_links
-- Description: Enable RLS on career_id.profile_social_links - users can only access social links for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.profile_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_social_links_select_own_profile"
  ON career_id.profile_social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_social_links_insert_own_profile"
  ON career_id.profile_social_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_social_links_update_own_profile"
  ON career_id.profile_social_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_social_links_delete_own_profile"
  ON career_id.profile_social_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_social_links.profile_id AND jss_user_id = auth.uid()
    )
  );
