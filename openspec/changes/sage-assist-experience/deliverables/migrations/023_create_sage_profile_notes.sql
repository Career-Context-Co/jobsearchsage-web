CREATE TABLE public.sage_profile_notes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id UUID NOT NULL,
  profile_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  note_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sage_profile_notes_logical_key
    UNIQUE (user_id, target_type, target_id, note_type)
);

CREATE INDEX idx_sage_profile_notes_lookup
  ON public.sage_profile_notes(user_id, profile_id, target_type, target_id);

CREATE INDEX idx_sage_profile_notes_note_lookup
  ON public.sage_profile_notes(user_id, profile_id, target_type, target_id, note_type)
;

CREATE OR REPLACE FUNCTION public.update_sage_profile_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER update_sage_profile_notes_updated_at
  BEFORE UPDATE ON public.sage_profile_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sage_profile_notes_updated_at();

ALTER TABLE public.sage_profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sage_profile_notes_select_own_user"
  ON public.sage_profile_notes FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "sage_profile_notes_insert_own_user"
  ON public.sage_profile_notes FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "sage_profile_notes_update_own_user"
  ON public.sage_profile_notes FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "sage_profile_notes_delete_own_user"
  ON public.sage_profile_notes FOR DELETE
  USING (user_id = (select auth.uid()));
