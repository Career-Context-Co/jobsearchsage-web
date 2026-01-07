-- Migration: 016_add_experience_context_notes
-- Description: Add context_notes column to support deep achievement enhancement context storage
-- Schema: career_id
-- Date: 2025-12-29

-- Add context_notes column to experience table for storing user-provided context
ALTER TABLE career_id.experience
ADD COLUMN context_notes TEXT;

-- Add column comment
COMMENT ON COLUMN career_id.experience.context_notes IS 
'User-provided context from enhancement flow (preserved for regenerations); stores accumulated story understanding for future AI regenerations';

