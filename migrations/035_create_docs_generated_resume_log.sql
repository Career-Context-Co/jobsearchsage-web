-- Migration: 035_create_docs_generated_resume_log
-- Description: Create public.docs_generated_resume_log table - tracks every PDF/DOCX download event per resume
-- Schema: public
-- Date: 2026-02-21

-- Create docs_generated_resume_log table
CREATE TABLE public.docs_generated_resume_log (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
  resume_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  download_format TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_docs_generated_resume_log_resume
    FOREIGN KEY (resume_id)
    REFERENCES public.docs_resumes(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_docs_generated_resume_log_profile
    FOREIGN KEY (profile_id)
    REFERENCES career_id.profiles(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_docs_generated_resume_log_format
    CHECK (download_format IN ('pdf', 'docx'))
);

-- Add comments
COMMENT ON TABLE public.docs_generated_resume_log IS 'Append-only log of resume download events. One row per download action.';
COMMENT ON COLUMN public.docs_generated_resume_log.id IS 'Auto-incrementing integer PK — log rows have no external reference need';
COMMENT ON COLUMN public.docs_generated_resume_log.resume_id IS 'Reference to the resume that was downloaded (doc_* prefixed ID)';
COMMENT ON COLUMN public.docs_generated_resume_log.profile_id IS 'Reference to the profile that triggered the download (denormalized for fast analytics)';
COMMENT ON COLUMN public.docs_generated_resume_log.download_format IS 'Format of the generated file: "pdf" or "docx"';
COMMENT ON COLUMN public.docs_generated_resume_log.generated_at IS 'Timestamp when the download was triggered';

-- Create indexes
CREATE INDEX idx_docs_generated_resume_log_resume_id ON public.docs_generated_resume_log(resume_id);
CREATE INDEX idx_docs_generated_resume_log_profile_id ON public.docs_generated_resume_log(profile_id);
