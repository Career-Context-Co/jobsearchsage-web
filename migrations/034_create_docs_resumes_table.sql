-- Migration: 034_create_docs_resumes_table
-- Description: Create public.docs_resumes table - stores persisted resume snapshots for each profile
-- Schema: public
-- Date: 2026-02-21

-- Create docs_resumes table
CREATE TABLE public.docs_resumes (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  design_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_docs_resumes_profile
    FOREIGN KEY (profile_id)
    REFERENCES career_id.profiles(id)
    ON DELETE CASCADE
);

-- Add comments
COMMENT ON TABLE public.docs_resumes IS 'Persisted resume snapshots — each row is a named resume owned by a profile. Content is replaced wholesale on save.';
COMMENT ON COLUMN public.docs_resumes.id IS 'Prefixed CUID2 identifier (doc_*) generated server-side';
COMMENT ON COLUMN public.docs_resumes.profile_id IS 'Reference to the profile that owns this resume';
COMMENT ON COLUMN public.docs_resumes.title IS 'Human-readable title auto-generated at creation time: "[First] [Last] Resume"';
COMMENT ON COLUMN public.docs_resumes.content IS 'Full editable resume state snapshot (summary, work experience, education, skills, certifications). Replaced wholesale on save.';
COMMENT ON COLUMN public.docs_resumes.design_settings IS 'Presentation settings snapshot (accentColor, etc.). Replaced wholesale on save.';
COMMENT ON COLUMN public.docs_resumes.created_at IS 'Timestamp when the resume was first created';
COMMENT ON COLUMN public.docs_resumes.updated_at IS 'Timestamp when the resume was last saved';

-- Create indexes
CREATE INDEX idx_docs_resumes_profile_id ON public.docs_resumes(profile_id);

-- Create updated_at trigger function for public schema (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Add trigger for updated_at
CREATE TRIGGER update_docs_resumes_updated_at
  BEFORE UPDATE ON public.docs_resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
