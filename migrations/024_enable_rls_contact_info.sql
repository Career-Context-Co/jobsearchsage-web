-- Migration: 024_enable_rls_contact_info
-- Description: Enable RLS on career_id.contact_info - users can only access contact info for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_info_select_own_profile"
  ON career_id.contact_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "contact_info_insert_own_profile"
  ON career_id.contact_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "contact_info_update_own_profile"
  ON career_id.contact_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "contact_info_delete_own_profile"
  ON career_id.contact_info FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = contact_info.profile_id AND jss_user_id = auth.uid()
    )
  );
