-- Migration: 021_alter_discovery_sessions
-- Description: Alter existing public.hero_discovery_sessions table to add missing columns for hero moments discovery workflow
-- Schema: public
-- Date: 2026-01-10
-- Note: Table already exists, this migration adds session_status and moment_count columns

-- Add session_status column
ALTER TABLE public.hero_discovery_sessions
  ADD COLUMN IF NOT EXISTS session_status TEXT NOT NULL DEFAULT 'active';

-- Add moment_count column
ALTER TABLE public.hero_discovery_sessions
  ADD COLUMN IF NOT EXISTS moment_count INTEGER NOT NULL DEFAULT 0;

-- Add comments for new columns
COMMENT ON COLUMN public.hero_discovery_sessions.session_status IS 'Current status of the discovery session (active, completed, abandoned)';
COMMENT ON COLUMN public.hero_discovery_sessions.moment_count IS 'Number of hero moments captured in this session';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_profile_id ON public.hero_discovery_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_hero_discovery_sessions_session_status ON public.hero_discovery_sessions(session_status);