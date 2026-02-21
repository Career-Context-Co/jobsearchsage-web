-- Migration: 033_enable_rls_hero_story_sessions
-- Description: Enable RLS on public.hero_story_sessions - users can only access sessions for their profile
-- Date: 2026-02-19

ALTER TABLE public.hero_story_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_story_sessions_select_own_profile"
  ON public.hero_story_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_story_sessions_insert_own_profile"
  ON public.hero_story_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_story_sessions_update_own_profile"
  ON public.hero_story_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_story_sessions_delete_own_profile"
  ON public.hero_story_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );
