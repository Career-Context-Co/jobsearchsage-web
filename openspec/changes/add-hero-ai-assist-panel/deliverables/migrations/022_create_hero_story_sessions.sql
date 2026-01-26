-- Migration: 022_alter_hero_story_sessions
-- Description: Add section_type, session_status, and moment_id to existing hero_story_sessions table
-- Schema: public
-- Date: 2026-01-26
-- Note: Table already exists from earlier migration, this adds new columns for section-based enhancement tracking

-- Add section_type column (which section is being enhanced)
ALTER TABLE public.hero_story_sessions
  ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'hurdle';

-- Add session_status column (following pattern from hero_discovery_sessions)
ALTER TABLE public.hero_story_sessions
  ADD COLUMN IF NOT EXISTS session_status TEXT NOT NULL DEFAULT 'active';

-- Add moment_id column (optional reference to source hero moment)
ALTER TABLE public.hero_story_sessions
  ADD COLUMN IF NOT EXISTS moment_id TEXT NULL;

-- Update table comment
COMMENT ON TABLE public.hero_story_sessions IS 'Tracks AI enhancement conversation sessions for individual HERO story sections (one session per section)';

-- Add comments for new columns
COMMENT ON COLUMN public.hero_story_sessions.section_type IS 'Which HERO section is being enhanced in this session (hurdle, expectation, response, outcome). One session = one section.';
COMMENT ON COLUMN public.hero_story_sessions.session_status IS 'Current status of the session (active, completed, abandoned). Follows pattern from hero_discovery_sessions.';
COMMENT ON COLUMN public.hero_story_sessions.moment_id IS 'Optional reference to career_id.hero_moments.id if this story was created from a moment via "Develop into HERO Story"';

-- Update session_data comment
COMMENT ON COLUMN public.hero_story_sessions.session_data IS 'JSONB containing conversation_history (array of {role, content}), moment_context {title, description}, source_experience (full experience object), current_field_values {field1, field2, field3}, and final_output (when completed)';

-- Note: Constraints and indexes will be added in a separate migration after validating column usage
