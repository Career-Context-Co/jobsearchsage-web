## 1. File Structure Reorganization

- [x] 1.1 Move `app/pages/resumes/generate.vue` → `app/pages/docs/resumes/[id].vue` (resume editor page, loads by resume ID)
- [x] 1.2 Create `app/pages/docs/resumes/index.vue` (resume list page at `/docs/resumes`)
- [x] 1.3 Move `app/components/resume/ContentEditor.vue` → `app/components/docs/resume/ContentEditor.vue`
- [x] 1.4 Move `app/components/resume/ContentEditorForm.vue` → `app/components/docs/resume/ContentEditorForm.vue`
- [x] 1.5 Move `app/components/resume/Designer.vue` → `app/components/docs/resume/Designer.vue`
- [x] 1.6 Move `app/components/resume/ResumePreview.vue` → `app/components/docs/resume/ResumePreview.vue`
- [x] 1.7 Delete the now-empty `app/pages/resumes/` and `app/components/resume/` directories
- [x] 1.8 Create `app/pages/docs/cover-letters.vue` with a "Coming Soon" placeholder page

## 2. Navigation Updates

- [x] 2.1 Update `app/layouts/default.vue`: replace the flat "Resume" link with a collapsible "Docs" group (type: 'trigger', like Profile) containing "Resumes" child (`/docs/resumes`) and "Cover Letters" child (disabled/coming soon)
- [x] 2.2 Update `app/pages/index.vue`: change the resume card link from `/resumes/generate` to `/docs/resumes`

## 3. Resume List Page (`/docs/resumes`)

- [x] 3.1 Implement `app/pages/docs/resumes/index.vue` with resume list UI (stubbed — real data fetched from API in task 7)
- [x] 3.2 Display each resume card with title, created/updated date, and a link to `/docs/resumes/[id]`
- [x] 3.3 Add empty state UI when no resumes exist, with a "New Resume" action button
- [x] 3.4 "New Resume" navigates to `/docs/resumes/new` (stub — will create DB record and navigate in task 7)

## 4. Resume Editor Page (`/docs/resumes/[id]`)

- [x] 4.1 `app/pages/docs/resumes/[id].vue` accepts route param `id` (stubbed — loads from careerIDStore until task 7)
- [x] 4.2 `editableData` and `accentColor` initialized from careerIDStore on mount (stub — will load from `content`/`design_settings` in task 7)
- [x] 4.3 "Save" button present in toolbar (disabled stub — will wire to PUT /api/docs/resumes/[id] in task 7)
- [x] 4.4 Page title displays resume title derived from contact info
- [x] 4.5 Component imports updated to `app/components/docs/resume/` paths (`DocsResumeContentEditorForm`, `DocsResumeDesigner`, `DocsResumePreview`)

## 5. Database Migrations

Schema notes:
- `docs_resumes.id` — TEXT PK, prefixed CUID2 (`doc_*`) generated server-side via `generatePrefixedId('doc')`
- `docs_generated_resume_log.id` — INTEGER PK GENERATED ALWAYS AS IDENTITY (log rows, no external reference)
- Content column is `content` (JSONB), not `content_snapshot`

- [x] 5.1 Write `migrations/034_create_docs_resumes_table.sql`: create `public.docs_resumes` with columns: `id` (TEXT PK), `profile_id` (TEXT FK → `career_id.profiles(id)` ON DELETE CASCADE), `title` (TEXT NOT NULL), `content` (JSONB NOT NULL DEFAULT '{}'), `design_settings` (JSONB NOT NULL DEFAULT '{}'), `created_at` (TIMESTAMPTZ DEFAULT NOW()), `updated_at` (TIMESTAMPTZ DEFAULT NOW()); add index on `profile_id`
- [x] 5.2 Write `migrations/035_create_docs_generated_resume_log.sql`: create `public.docs_generated_resume_log` with columns: `id` (INTEGER PK GENERATED ALWAYS AS IDENTITY), `resume_id` (TEXT FK → `public.docs_resumes(id)` ON DELETE CASCADE), `profile_id` (TEXT FK → `career_id.profiles(id)` ON DELETE CASCADE), `download_format` (TEXT NOT NULL), `generated_at` (TIMESTAMPTZ DEFAULT NOW()); add indexes on `resume_id` and `profile_id`
- [x] 5.3 Write `migrations/036_enable_rls_docs_resumes.sql`: enable RLS on `public.docs_resumes` and create SELECT/INSERT/UPDATE/DELETE policies using `EXISTS (SELECT 1 FROM career_id.profiles WHERE id = docs_resumes.profile_id AND jss_user_id = auth.uid())`
- [x] 5.4 Write `migrations/037_enable_rls_docs_generated_resume_log.sql`: enable RLS on `public.docs_generated_resume_log` and create SELECT/INSERT/UPDATE/DELETE policies using the same `career_id.profiles` join pattern

## 6. Backend API Endpoints

Column/ID notes (apply to all endpoints below):
- `id` is TEXT (`doc_*` prefix), pass as string — do not coerce to Number
- DB column is `content` (not `content_snapshot`); camelCase in responses: `content`

- [x] 6.1 Write `server/api/docs/resumes/index.get.ts` — GET /api/docs/resumes: list resumes for authenticated user's profile
- [x] 6.2 Write `server/api/docs/resumes/index.post.ts` — POST /api/docs/resumes: create new resume with `generatePrefixedId('doc')`, snapshot + auto-title
- [x] 6.3 Write `server/api/docs/resumes/[id].get.ts` — GET /api/docs/resumes/:id: load resume by `doc_*` ID
- [x] 6.4 Write `server/api/docs/resumes/[id].put.ts` — PUT /api/docs/resumes/:id: save `content` and `design_settings`
- [ ] 6.5 Write `server/api/docs/resumes/[id]/downloads.post.ts` — POST /api/docs/resumes/:id/downloads: insert row into `docs_generated_resume_log` with `resume_id`, `profile_id`, `download_format`
- [x] 6.6 Update existing API files (6.1–6.4) to use `content` column name and `doc_*` TEXT id (fix `Number(idParam)` → string, `content_snapshot` → `content`)

## 7. Connect Frontend to Backend (after migrations run)

- [x] 7.1 Update `app/pages/docs/resumes/index.vue`: replace stub with real GET /api/docs/resumes call
- [x] 7.2 Update `app/pages/docs/resumes/index.vue`: "New Resume" calls POST /api/docs/resumes, navigates to `/docs/resumes/[id]`
- [x] 7.3 Update `app/pages/docs/resumes/[id].vue`: load `content` and `design_settings` from GET /api/docs/resumes/:id on mount
- [x] 7.4 Update `app/pages/docs/resumes/[id].vue`: enable "Save" button — wire to PUT /api/docs/resumes/:id
- [x] 7.5 After each successful download, call POST /api/docs/resumes/:id/downloads with `downloadFormat`

## 8. Verification

- [ ] 8.1 Verify `/docs/resumes` loads and displays the resume list (or empty state)
- [ ] 8.2 Verify "New Resume" creates a record and navigates to `/docs/resumes/[id]`
- [ ] 8.3 Verify `/docs/resumes/[id]` loads the saved snapshot and initializes the editor correctly
- [ ] 8.4 Verify saving updates the `content` column in the database
- [ ] 8.5 Verify PDF and DOCX downloads log to `docs_generated_resume_log`
- [ ] 8.6 Verify the "Docs" nav group appears in the sidebar with correct children
- [ ] 8.7 Verify the old `/resumes/generate` route no longer exists (404)
- [ ] 8.8 Verify RLS prevents cross-profile access to `docs_resumes` and `docs_generated_resume_log`
