-- Migration: 012_rename_skill_name_cache
-- Description: Rename skill_name_cache to name for clarity
-- Schema: career_id
-- Date: 2025-12-02

-- Rename column from skill_name_cache to name
ALTER TABLE career_id.profile_skills 
  RENAME COLUMN skill_name_cache TO name;

-- Update comment to reflect new purpose
COMMENT ON COLUMN career_id.profile_skills.name IS 
  'User-provided skill name (what they typed). Always displayed. May be matched to reference.skills later via skill_id.';

