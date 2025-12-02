-- Migration: 013_add_soft_delete_to_profiles
-- Description: Add soft delete columns to profiles table for churn tracking
-- Schema: career_id
-- Date: 2025-11-26
-- Reason: Track when users delete profiles without losing historical data for analytics

-- Add deleted_at timestamp column
ALTER TABLE career_id.profiles ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add is_deleted boolean flag
ALTER TABLE career_id.profiles ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- Create index on is_deleted for efficient filtering of active profiles
CREATE INDEX idx_profiles_is_deleted ON career_id.profiles(is_deleted) WHERE is_deleted = false;

-- Create index on deleted_at for churn analytics
CREATE INDEX idx_profiles_deleted_at ON career_id.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN career_id.profiles.deleted_at IS 'Timestamp when profile was soft deleted. NULL if profile is active. Used for churn tracking and analytics.';
COMMENT ON COLUMN career_id.profiles.is_deleted IS 'Boolean flag for soft delete. FALSE = active profile, TRUE = deleted profile. Enables quick filtering without complex queries.';

-- Update trigger function to handle soft delete (optional)
-- Note: Application logic should set both is_deleted=true AND deleted_at=NOW() together
-- This ensures consistency between the flag and timestamp

