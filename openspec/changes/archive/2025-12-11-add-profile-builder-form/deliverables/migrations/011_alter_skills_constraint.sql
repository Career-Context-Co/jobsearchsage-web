-- Migration: 011_alter_skills_constraint
-- Description: Change skills table unique constraint from skill_name to (skill_name, category)
-- Schema: reference
-- Date: 2025-11-24
-- Reason: Allow same skill name in different categories to preserve context (e.g., "Testing" in QA vs Medical)

-- Drop existing unique constraint on skill_name
ALTER TABLE reference.skills DROP CONSTRAINT IF EXISTS skills_skill_name_key;

-- Add composite unique constraint on (skill_name, category)
ALTER TABLE reference.skills ADD CONSTRAINT unique_skill_per_category UNIQUE (skill_name, category);

-- Add comment explaining the change
COMMENT ON CONSTRAINT unique_skill_per_category ON reference.skills IS 
  'Allows same skill name in different categories to preserve industry-specific context. Example: "Testing" in QA category vs "Testing" in Medical category have different meanings.';

