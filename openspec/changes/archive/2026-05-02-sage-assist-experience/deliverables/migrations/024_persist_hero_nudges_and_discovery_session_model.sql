CREATE TABLE public.hero_story_nudges (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  experience_id INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  signal TEXT NOT NULL,
  context TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  hero_story_id TEXT NULL,
  discovery_session_id INTEGER NULL,
  accepted_at TIMESTAMPTZ NULL,
  declined_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hero_story_nudges_status_check
    CHECK (status IN ('active', 'accepted', 'declined', 'converted', 'stale')),
  CONSTRAINT hero_story_nudges_content_unique
    UNIQUE (profile_id, experience_id, content_hash),
  CONSTRAINT hero_story_nudges_discovery_session_fk
    FOREIGN KEY (discovery_session_id)
    REFERENCES public.hero_discovery_sessions(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_hero_story_nudges_profile_status
  ON public.hero_story_nudges(profile_id, status);

CREATE INDEX idx_hero_story_nudges_experience
  ON public.hero_story_nudges(profile_id, experience_id);

CREATE INDEX idx_hero_story_nudges_content_hash
  ON public.hero_story_nudges(profile_id, experience_id, content_hash);

CREATE INDEX idx_hero_story_nudges_hero_story_id
  ON public.hero_story_nudges(hero_story_id)
  WHERE hero_story_id IS NOT NULL;

CREATE INDEX idx_hero_story_nudges_discovery_session_id
  ON public.hero_story_nudges(discovery_session_id)
  WHERE discovery_session_id IS NOT NULL;

CREATE TRIGGER update_hero_story_nudges_updated_at
  BEFORE UPDATE ON public.hero_story_nudges
  FOR EACH ROW
  EXECUTE FUNCTION career_id.update_updated_at_column();

ALTER TABLE public.hero_story_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_story_nudges_select_own_profile"
  ON public.hero_story_nudges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_nudges.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_nudges_insert_own_profile"
  ON public.hero_story_nudges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_nudges.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_nudges_update_own_profile"
  ON public.hero_story_nudges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_nudges.profile_id AND jss_user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_nudges.profile_id AND jss_user_id = (select auth.uid())
    )
  );

CREATE POLICY "hero_story_nudges_delete_own_profile"
  ON public.hero_story_nudges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM career_id.profiles
      WHERE id = hero_story_nudges.profile_id AND jss_user_id = (select auth.uid())
    )
  );

ALTER TABLE public.hero_discovery_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'moment_discovery',
  ADD COLUMN IF NOT EXISTS source_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_experience_id INTEGER NULL,
  ADD COLUMN IF NOT EXISTS hero_nudge_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS hero_story_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS progress_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.hero_discovery_sessions
  ADD CONSTRAINT hero_discovery_sessions_session_type_check
  CHECK (session_type IN ('moment_discovery', 'experience_nudge_story'));

ALTER TABLE public.hero_discovery_sessions
  ADD CONSTRAINT hero_discovery_sessions_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('experience'));

ALTER TABLE public.hero_discovery_sessions
  ADD CONSTRAINT hero_discovery_sessions_hero_nudge_fk
  FOREIGN KEY (hero_nudge_id)
  REFERENCES public.hero_story_nudges(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_session_type
  ON public.hero_discovery_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_source_experience_id
  ON public.hero_discovery_sessions(source_experience_id)
  WHERE source_experience_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_hero_nudge_id
  ON public.hero_discovery_sessions(hero_nudge_id)
  WHERE hero_nudge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_hero_story_id
  ON public.hero_discovery_sessions(hero_story_id)
  WHERE hero_story_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_nudge_active
  ON public.hero_discovery_sessions(profile_id, source_experience_id, session_status)
  WHERE session_type = 'experience_nudge_story';
