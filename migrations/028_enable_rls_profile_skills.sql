-- Migration: 028_enable_rls_profile_skills
-- Description: Enable RLS on career_id.profile_skills - users can only access skills for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.profile_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_skills_select_own_profile"
  ON career_id.profile_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_skills_insert_own_profile"
  ON career_id.profile_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_skills_update_own_profile"
  ON career_id.profile_skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_skills_delete_own_profile"
  ON career_id.profile_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = profile_skills.profile_id AND jss_user_id = auth.uid()
    )
  );
