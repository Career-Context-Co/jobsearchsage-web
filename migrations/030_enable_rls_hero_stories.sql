-- Migration: 030_enable_rls_hero_stories
-- Description: Enable RLS on career_id.hero_stories - users can only access hero stories for their profile
-- Date: 2026-02-19

ALTER TABLE career_id.hero_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_stories_select_own_profile"
  ON career_id.hero_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_stories_insert_own_profile"
  ON career_id.hero_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_stories_update_own_profile"
  ON career_id.hero_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = auth.uid()
    )
  );

CREATE POLICY "hero_stories_delete_own_profile"
  ON career_id.hero_stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_stories.profile_id AND jss_user_id = auth.uid()
    )
  );
