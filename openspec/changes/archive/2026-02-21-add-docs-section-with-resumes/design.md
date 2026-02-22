## Context

The app currently has a flat "Resume" nav link pointing to `/resumes/generate` — a stateless page that builds a resume from live profile data each session. There is no persistence: every visit starts fresh, and downloads are not tracked. The `resume-generation` spec exists but has 0 requirements.

This change restructures the nav into a "Docs" section (mirroring the "Profile" collapsible group), moves the resume generator under `/docs/resumes/[id]`, and introduces a `docs` PostgreSQL schema with two tables for persistence and download tracking.

Existing code affected:
- [`app/layouts/default.vue`](app/layouts/default.vue) — nav definition
- [`app/pages/resumes/generate.vue`](app/pages/resumes/generate.vue) — the entire resume generator page
- [`app/components/resume/`](app/components/resume/) — 4 components (ContentEditor, ContentEditorForm, Designer, ResumePreview)
- [`app/pages/index.vue`](app/pages/index.vue) — home page resume card link

---

## Goals / Non-Goals

**Goals:**
- Rename "Resume" nav to "Docs" collapsible group with "Resumes" and "Cover Letters (coming soon)" children
- Move all resume pages/components to `docs/` subdirectories
- Introduce `docs.resumes` table to persist resume snapshots (content + design settings)
- Introduce `docs.generated_resume_log` table to track download events
- Add `/docs/resumes` index page listing saved resumes
- Add `/docs/resumes/[id]` editor page that loads from a saved snapshot
- Add `/docs/cover-letters` placeholder page

**Non-Goals:**
- Implementing the API endpoints for save/load (DB interaction deferred to follow-on change)
- Cover letter generation (placeholder only)
- Resume versioning / history (snapshot is replaced on save, not versioned)
- Sharing or exporting resume links

---

## Decisions

### D1: `docs_` prefix in `public` schema (no new schema)

**Decision**: Create new tables in the `public` schema with a `docs_` prefix: `public.docs_resumes` and `public.docs_generated_resume_log`.

**Rationale**: All existing tables (hero_stories, hero_moments, hero_story_sessions, etc.) live in `public` schema. Introducing a new PostgreSQL schema adds operational complexity (search_path, permissions, Supabase RLS configuration) without meaningful benefit at this scale. The `docs_` prefix provides the same namespace clarity as a separate schema.

**Alternative considered**: New `docs` PostgreSQL schema. Rejected — adds complexity; existing pattern uses `public` schema with descriptive table names.

### D2: INTEGER PK for `docs.resumes` (not prefixed CUID2)

**Decision**: Use `INTEGER GENERATED ALWAYS AS IDENTITY` for `docs.resumes.id`.

**Rationale**: Resumes are child documents of a profile, always accessed in profile context (like `experience`, `education`). They don't need a self-documenting public ID. The route `/docs/resumes/[id]` uses the integer ID directly.

**Alternative considered**: Prefixed ID like `res_...` (Stripe-style). Rejected — adds complexity without benefit since resumes are never referenced cross-entity.

### D3: Single `content_snapshot` JSONB column (not normalized columns)

**Decision**: Store the full editable resume state as a single `content_snapshot` JSONB column.

**Rationale**: The resume content is a complex nested structure (summary, work experience with highlights, education, skills, certifications) that mirrors the `EditableData` interface already defined in the generate page. Storing as JSONB avoids a complex normalized schema for what is essentially a document snapshot. The snapshot is replaced wholesale on save — no partial updates needed.

**JSONB shape** (mirrors `EditableData` from [`app/pages/resumes/generate.vue`](app/pages/resumes/generate.vue)):
```json
{
  "summary": { "text": "...", "enabled": true },
  "workExperience": [
    {
      "id": 1,
      "employer": "Acme Corp",
      "jobTitle": "Engineer",
      "employmentType": "Full-time",
      "locationType": "Remote",
      "startDate": "2020-01-01",
      "endDate": null,
      "currentPosition": true,
      "highlights": [
        { "id": "1-h0", "text": "...", "selected": true }
      ],
      "selected": true
    }
  ],
  "education": [...],
  "skills": [...],
  "certifications": [...]
}
```

**Alternative considered**: Separate junction tables for selected experience IDs, etc. Rejected — over-engineered for a snapshot model; JSONB is simpler and sufficient.

### D4: Separate `design_settings` JSONB column

**Decision**: Store design settings (accent color, section visibility) in a separate `design_settings` JSONB column rather than embedding in `content_snapshot`.

**Rationale**: Separates concerns — content (what's in the resume) vs. presentation (how it looks). Makes it easy to reset design without touching content, and vice versa.

**JSONB shape**:
```json
{
  "accentColor": "#0d9488",
  "sectionsEnabled": {
    "summary": true,
    "workExperience": true,
    "education": true,
    "skills": true,
    "certifications": false
  }
}
```

### D5: Auto-generated title from contact info

**Decision**: Title is `"[FirstName] [LastName] Resume [id]"` — generated at creation time from `career_id.contact_info`, stored as TEXT NOT NULL.

**Rationale**: Users don't need to name resumes manually. The auto-title is descriptive and unique per resume. The `id` suffix disambiguates multiple resumes.

**Alternative considered**: User-editable title. Deferred — can be added later without schema changes since the column is already TEXT.

### D6: Route structure `/docs/resumes/[id]` (not `/docs/resumes/generate`)

**Decision**: Each resume has its own URL by integer ID.

**Rationale**: Enables bookmarking, direct linking, and browser history for specific resumes. Aligns with the list+detail pattern (`/docs/resumes` → `/docs/resumes/[id]`).

### D7: File move — `app/components/resume/` → `app/components/docs/resume/`

**Decision**: Move all 4 resume components into a `docs/resume/` subdirectory.

**Rationale**: Nuxt auto-imports components by directory path. Moving to `docs/resume/` keeps the component namespace consistent with the new route structure. No import changes needed in consuming pages — Nuxt resolves by component name.

### D8: RLS on `docs` tables via `career_id.profiles.jss_user_id`

**Decision**: RLS policies follow the same pattern as existing tables — join to `career_id.profiles` on `profile_id` and check `jss_user_id = auth.uid()`.

**Rationale**: Consistent with all 10+ existing RLS migrations. No new auth pattern needed.

---

## Risks / Trade-offs

- **Snapshot staleness**: Once saved, a resume snapshot doesn't reflect profile updates. Users must re-open and re-save to pick up profile changes. → Acceptable trade-off; the snapshot model is intentional (historical accuracy).
- **JSONB size**: Large profiles with many experiences/highlights could produce large snapshots. → Unlikely to be a problem in practice; PostgreSQL handles JSONB efficiently up to MB scale.
- **Breaking route change**: `/resumes/generate` will 404 after this change. → Add a redirect in Nuxt config or middleware if needed (low priority — no external links expected).
- **Component rename**: Moving `app/components/resume/` to `app/components/docs/resume/` changes auto-import names (e.g., `ResumeContentEditor` → `DocsResumeContentEditor` if Nuxt prefixes by directory). → Verify Nuxt component naming behavior; may need to update template references in the generate page.

---

## Migration Plan

4 sequential migrations:

| # | File | Action |
|---|------|--------|
| 034 | `034_create_docs_resumes_table.sql` | Create `public.docs_resumes` table |
| 035 | `035_create_docs_generated_resume_log.sql` | Create `public.docs_generated_resume_log` table |
| 036 | `036_enable_rls_docs_resumes.sql` | Enable RLS + 4 policies on `public.docs_resumes` |
| 037 | `037_enable_rls_docs_generated_resume_log.sql` | Enable RLS + 4 policies on `public.docs_generated_resume_log` |

**Rollback**: `DROP TABLE public.docs_generated_resume_log; DROP TABLE public.docs_resumes;`. No data loss risk (new tables, no existing data).

---

## Open Questions

- Should `/resumes/generate` redirect to `/docs/resumes` (302) or just 404? (Low priority — no known external links)
- Should the resume index page show a thumbnail/preview of each saved resume, or just a list with title + date? (UX decision for implementation phase)
- Should `docs.generated_resume_log` also store the resume title at download time (denormalized) for analytics? (Can add later without breaking changes)
