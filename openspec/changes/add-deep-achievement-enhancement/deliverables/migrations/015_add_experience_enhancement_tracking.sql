-- Migration: 015_add_experience_enhancement_tracking
-- Description: Add last_enhanced_at column to track deep achievement enhancement status
-- Schema: career_id
-- Date: 2025-12-29

-- Add last_enhanced_at column to experience table for tracking enhancement status
ALTER TABLE career_id.experience
ADD COLUMN last_enhanced_at TIMESTAMPTZ;

-- Add column comment
COMMENT ON COLUMN career_id.experience.last_enhanced_at IS 
'Timestamp of last deep achievement enhancement (NULL if never enhanced); used to track enhancement status and enable sorting by enhancement status';

