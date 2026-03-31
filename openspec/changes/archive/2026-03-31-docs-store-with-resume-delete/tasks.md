## Phase 1: Backend

### BE-001: Delete Resume Endpoint
- [x] Create `server/api/docs/resumes/[id].delete.ts`
- [x] Look up profile by `jss_user_id`, verify resume ownership (404 if not found), following pattern in `[id].put.ts`
- [x] Delete the `docs_resumes` row
- [x] Return `{ success: true }`

**Dependencies:** None
**Success criteria:** `DELETE /api/docs/resumes/:id` returns 200 for owned resume, 404 for unowned or missing; soft-deleted record no longer appears in `GET /api/docs/resumes`

---

## Phase 2: Store & Types

### FE-001: Type Definitions
- [x] Create `app/types/docs/index.ts`
- [x] Define `ResumeListItem` (`id`, `title`, `updatedAt`, optional `content`, optional `designSettings`)
- [x] Define `ResumeContent` and `ResumeDesignSettings` (extract from existing page usage in `[id].vue`)

**Dependencies:** None
**Success criteria:** Types compile cleanly and cover all fields used in `index.vue` and `[id].vue`

---

### FE-002: docsStore
- [x] Create `app/stores/docsStore.ts` using options-API `defineStore('docs', { state, actions })`
- [x] State: `resumes: ResumeListItem[]`, `isLoading: boolean`, `isSaving: boolean`
- [x] Action `listResumes()` — `GET /api/docs/resumes`, populate `resumes` with lightweight items, set `isLoading` with `finally` cleanup
- [x] Action `getResume(id)` — return cached item immediately if `content` present; otherwise `GET /api/docs/resumes/:id`, merge `content` + `designSettings` onto list item, return enriched item; set `isLoading` with `finally` cleanup
- [x] Action `createResume(payload)` — `POST /api/docs/resumes`, prepend new `ResumeListItem` to `resumes`, return created record
- [x] Action `updateResume(id, patch)` — `PUT /api/docs/resumes/:id`, merge patch back onto list item in `resumes`, set `isSaving` with `finally` cleanup
- [x] Action `deleteResume(id)` — `DELETE /api/docs/resumes/:id`, splice item from `resumes` on success, set `isSaving` with `finally` cleanup
- [x] All actions throw on API failure (no error state in store)

**Dependencies:** FE-001, BE-001
**Success criteria:** Store compiles with no TS errors; actions update `resumes` array correctly; `isLoading`/`isSaving` flags clear in all code paths

---

## Phase 3: Integration

### FE-003: Migrate Resume List Page (`index.vue`)
- [x] Import and use `docsStore` instead of local `$fetch` calls
- [x] Replace local `resumes` ref with `docsStore.resumes`
- [x] Replace local `isLoading` ref with `docsStore.isLoading`
- [x] Replace `$fetch('GET /api/docs/resumes')` in `onMounted` with `docsStore.listResumes()`
- [x] Replace `$fetch('POST /api/docs/resumes')` in create handler with `docsStore.createResume(payload)`
- [x] Wrap store calls in try/catch; set local `error` ref on failure

**Dependencies:** FE-002
**Success criteria:** List page loads resumes, creates new resume, and navigates to editor — identical behaviour to before, no direct `$fetch` calls remaining

---

### FE-004: Migrate Resume Editor Page (`[id].vue`)
- [x] Import and use `docsStore` instead of local `$fetch` calls
- [x] Replace `$fetch('GET /api/docs/resumes/:id')` in `onMounted` with `docsStore.getResume(id)` — initialise local editor state from returned item
- [x] Replace `$fetch('PUT /api/docs/resumes/:id')` in save handler with `docsStore.updateResume(id, patch)`
- [x] Replace inline title save `$fetch` with `docsStore.updateResume(id, { title })`
- [x] Retain all local editor state (unsaved content, zoom, panel toggle) as component-local refs
- [x] Wrap store calls in try/catch; set local `error` ref on failure

**Dependencies:** FE-002
**Success criteria:** Editor loads resume (from cache if already visited), saves content/title/design settings — identical behaviour to before; navigating back to list does not trigger a new list fetch

---

### FE-005: Delete Resume UI on List Page
- [x] Add `confirmingDeleteId: string | null` as a local ref in `index.vue`
- [x] Add delete icon/button to each resume card; on click set `confirmingDeleteId = resume.id`
- [x] When `confirmingDeleteId === resume.id`, show inline "Are you sure? [Cancel] [Delete]" prompt
- [x] Cancel clears `confirmingDeleteId`
- [x] Confirm calls `docsStore.deleteResume(id)`; on success `confirmingDeleteId` is cleared (store already removes item from list)
- [x] Wrap in try/catch; show local error on failure

**Dependencies:** FE-002, FE-003
**Success criteria:** Delete button appears on each card; confirmation prevents accidental deletion; confirmed delete removes card from list; cancel leaves list unchanged
