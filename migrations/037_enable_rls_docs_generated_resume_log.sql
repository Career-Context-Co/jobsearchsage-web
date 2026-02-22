-- Migration: 037_enable_rls_docs_generated_resume_log
-- Description: Enable RLS on public.docs_generated_resume_log - users can only access download logs for their own profile
-- Date: 2026-02-21

ALTER TABLE public.docs_generated_resume_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_generated_resume_log_select_own_profile"
  ON public.docs_generated_resume_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_generated_resume_log_insert_own_profile"
  ON public.docs_generated_resume_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_generated_resume_log_update_own_profile"
  ON public.docs_generated_resume_log FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_generated_resume_log_delete_own_profile"
  ON public.docs_generated_resume_log FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_generated_resume_log.profile_id AND jss_user_id = auth.uid()
    )
  );
