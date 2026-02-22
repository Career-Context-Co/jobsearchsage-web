-- Migration: 036_enable_rls_docs_resumes
-- Description: Enable RLS on public.docs_resumes - users can only access resumes for their own profile
-- Date: 2026-02-21

ALTER TABLE public.docs_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_resumes_select_own_profile"
  ON public.docs_resumes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_resumes_insert_own_profile"
  ON public.docs_resumes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_resumes_update_own_profile"
  ON public.docs_resumes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "docs_resumes_delete_own_profile"
  ON public.docs_resumes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid()
    )
  );
