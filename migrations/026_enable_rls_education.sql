-- Migration: 026_enable_rls_education
-- Description: Enable RLS on career_id.education - users can only access education for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "education_select_own_profile"
  ON career_id.education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "education_insert_own_profile"
  ON career_id.education FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "education_update_own_profile"
  ON career_id.education FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "education_delete_own_profile"
  ON career_id.education FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = education.profile_id AND jss_user_id = auth.uid()
    )
  );
