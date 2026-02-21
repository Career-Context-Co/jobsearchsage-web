-- Migration: 031_enable_rls_hero_moments
-- Description: Enable RLS on career_id.hero_moments - users can only access hero moments for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.hero_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_moments_select_own_profile"
  ON career_id.hero_moments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_moments_insert_own_profile"
  ON career_id.hero_moments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_moments_update_own_profile"
  ON career_id.hero_moments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_moments_delete_own_profile"
  ON career_id.hero_moments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_moments.profile_id AND jss_user_id = auth.uid()
    )
  );
