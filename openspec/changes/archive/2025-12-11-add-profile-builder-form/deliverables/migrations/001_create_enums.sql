-- Migration: 001_create_enums_and_schemas
-- Description: Create PostgreSQL ENUMs and schemas for Career Sage Profile
-- Schemas: career_id (profile data), reference (lookup/catalog data)
-- Date: 2025-11-24

-- Create schemas
CREATE SCHEMA IF NOT EXISTS career_id;  -- Profile and user data
CREATE SCHEMA IF NOT EXISTS reference;   -- Reference/lookup/catalog data

-- Profile completion status enum
CREATE TYPE career_id.completion_status_enum AS ENUM (
  'incomplete',
  'complete',
  'verified'
);

COMMENT ON TYPE career_id.completion_status_enum IS 'Profile completion status: incomplete (in progress), complete (all required fields filled), verified (admin/system verified)';

-- Employment type enum
CREATE TYPE career_id.employment_type_enum AS ENUM (
  'full_time',
  'part_time',
  'self_employed',
  'freelance',
  'contract',
  'internship',
  'apprenticeship',
  'seasonal',
  'volunteer'
);

COMMENT ON TYPE career_id.employment_type_enum IS 'Type of employment or professional engagement';

-- Location type enum
CREATE TYPE career_id.location_type_enum AS ENUM (
  'on_site',
  'hybrid',
  'remote'
);

COMMENT ON TYPE career_id.location_type_enum IS 'Work location arrangement type';

-- Skill proficiency level enum
CREATE TYPE career_id.skill_level_enum AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

COMMENT ON TYPE career_id.skill_level_enum IS 'User proficiency level with a specific skill';

