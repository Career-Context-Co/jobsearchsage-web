-- Migration: 025_enable_rls_experience
-- Description: Enable RLS on career_id.experience - users can only access experience for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experience_select_own_profile"
  ON career_id.experience FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "experience_insert_own_profile"
  ON career_id.experience FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "experience_update_own_profile"
  ON career_id.experience FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "experience_delete_own_profile"
  ON career_id.experience FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = experience.profile_id AND jss_user_id = auth.uid()
    )
  );
