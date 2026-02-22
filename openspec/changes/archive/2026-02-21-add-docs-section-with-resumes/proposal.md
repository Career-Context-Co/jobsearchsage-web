## Why

The current "Resume" navigation item is a flat link to a single generate page with no persistence — users lose their resume configuration on every visit. Renaming it to "Docs" and introducing saved resume snapshots gives users a proper document management experience and lays the foundation for future document types (cover letters, etc.).

## What Changes

- **BREAKING** Rename navigation item "Resume" → "Docs" (collapsible group, like Profile)
- **BREAKING** Move route `/resumes/generate` → `/docs/resumes` (list) + `/docs/resumes/[id]` (editor)
- **BREAKING** Move `app/pages/resumes/` → `app/pages/docs/resumes/` and `app/components/resume/` → `app/components/docs/resume/`
- Add `/docs/resumes` index page listing all saved resumes for the profile
- Add `/docs/resumes/[id]` editor page (replaces current generate page, loads from saved snapshot)
- Add `/docs/cover-letters` placeholder page ("Coming Soon")
- Add new `docs` PostgreSQL schema with two tables:
  - `docs.resumes` — stores resume snapshots (content + design settings) per profile
  - `docs.generated_resume_log` — tracks each download event (format, timestamp)
- Resume title auto-generated as `"[FirstName] [LastName] Resume [id]"` from contact info
- Resume content snapshot (JSONB) captures the full editable state at save time; re-opening a resume loads from snapshot and replaces it on save

## Capabilities

### New Capabilities
- `docs-navigation`: Top-level "Docs" collapsible nav group replacing the flat "Resume" link; contains "Resumes" and "Cover Letters (coming soon)" children
- `resume-persistence`: Ability to save, list, and reopen resume snapshots; each resume stores content_snapshot and design_settings JSONB; download events logged to generated_resume_log

### Modified Capabilities
- `resume-generation`: Requirements change — resume generation now operates on a saved `docs.resumes` record (loaded by ID) rather than being a stateless session; content is persisted and re-editable

## Impact

- **Navigation**: [`app/layouts/default.vue`](app/layouts/default.vue) — nav restructure
- **Pages**: [`app/pages/resumes/generate.vue`](app/pages/resumes/generate.vue) moved and split into index + `[id]` pages under `app/pages/docs/resumes/`
- **Components**: [`app/components/resume/`](app/components/resume/) moved to `app/components/docs/resume/`
- **Home page**: [`app/pages/index.vue`](app/pages/index.vue) — resume link updated
- **Database**: New `docs` schema; migrations 034–037 (create tables + RLS)
- **No API changes** in this change — DB interaction for save/load will be added in a follow-on change
