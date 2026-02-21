-- Migration: 032_enable_rls_hero_discovery_sessions
-- Description: Enable RLS on public.hero_discovery_sessions - users can only access sessions for their profile
-- Date: 2026-02-19

ALTER TABLE public.hero_discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_discovery_sessions_select_own_profile"
  ON public.hero_discovery_sessions FOR SELECT
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_discovery_sessions_insert_own_profile"
  ON public.hero_discovery_sessions FOR INSERT
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_discovery_sessions_update_own_profile"
  ON public.hero_discovery_sessions FOR UPDATE
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_discovery_sessions_delete_own_profile"
  ON public.hero_discovery_sessions FOR DELETE
  USING (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_discovery_sessions.profile_id AND jss_user_id = auth.uid()
    )
  );
