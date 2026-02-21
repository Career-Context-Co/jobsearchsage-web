-- Migration: 027_enable_rls_certifications
-- Description: Enable RLS on career_id.certifications - users can only access certifications for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certifications_select_own_profile"
  ON career_id.certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "certifications_insert_own_profile"
  ON career_id.certifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "certifications_update_own_profile"
  ON career_id.certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "certifications_delete_own_profile"
  ON career_id.certifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = certifications.profile_id AND jss_user_id = auth.uid()
    )
  );
