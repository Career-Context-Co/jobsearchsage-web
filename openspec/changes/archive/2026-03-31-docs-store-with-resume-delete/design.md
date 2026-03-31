## Context

The `/docs` resume pages (`index.vue` and `[id].vue`) currently manage their own data independently: each page calls `$fetch` directly and holds local `ref` state. There is no delete capability — no API endpoint and no UI affordance.

All other stores in the project (`accountStore`, `careerIDStore`, `sageAIStore`) follow the **options-API Pinia pattern** (`defineStore('id', { state, getters, actions })`). Data is fetched inside actions with `$fetch`, a single `isLoading` flag brackets async reads, and errors are handled in the calling component — not stored in Pinia state.

The `docs_resumes` table has no `deleted_at` column — the migration (`034_create_docs_resumes_table.sql`) never added one. Deletes are hard deletes. The `docs_generated_resume_log` table has `ON DELETE CASCADE` on its `resume_id` FK, so download logs are automatically removed when a resume is deleted. No migration is needed.

## Goals / Non-Goals

**Goals:**
- Introduce a `docsStore` Pinia store that owns the resume list cache and exposes all CRUD actions consumed by `/docs` pages.
- Add a `DELETE /api/docs/resumes/:id` endpoint that hard-deletes the resume row.
- Migrate `index.vue` and `[id].vue` to read/write exclusively through `docsStore`, removing all direct `$fetch` calls.
- Add a delete affordance to the resume list UI with a confirmation step before calling the store action.

**Non-Goals:**
- Resume recovery/undo after deletion.
- Cover letters or any non-resume doc type.
- Optimistic UI updates — all mutations wait for the server response before updating local cache.
- Pagination or infinite scroll on the resume list.
- Real-time sync across browser tabs.

## Decisions

### 1. Options-API Pinia store (consistent with existing stores)

All four existing stores use the options API. Using `setup()` style here would introduce a second pattern for no benefit. `docsStore` will follow the same `defineStore('docs', { state, getters, actions })` shape, matching `careerIDStore` as the closest template (many CRUD actions, typed state).

**Alternatives considered**: Setup-function stores (more flexible, better TS inference) — rejected to keep conventions uniform.

### 2. Single list of enriched items — lazy content hydration

The store holds one array of `ResumeListItem` objects. The list endpoint returns only lightweight fields (`id`, `title`, `updatedAt`). When the editor page opens a resume, the store fetches the full record and merges `content` and `designSettings` onto the existing list item in place — so navigating back to the list requires no re-fetch, and the editor re-opening the same resume finds the content already present.

State shape:
```ts
interface ResumeListItem {
  id: string
  title: string
  updatedAt: string
  // enriched lazily when the editor loads the record:
  content?: ResumeContent
  designSettings?: ResumeDesignSettings
}

state: () => ({
  resumes: [] as ResumeListItem[],
  isLoading: false,
  isSaving: false,
})
```

- `listResumes()` — fetches the list, populates `resumes` with lightweight items (content fields absent).
- `getResume(id)` — if the item already has `content`, returns it immediately (no fetch). Otherwise fetches the full record, merges `content` + `designSettings` onto the list item, and returns it. `[id].vue` reads from this merged item for its local editor state.
- `updateResume(id, patch)` — calls `PUT`, then merges the patch back onto the list item to keep the cache current.
- `deleteResume(id)` — calls `DELETE`, then splices the item from `resumes`.

**Alternatives considered**: Separate `resumeMap` — redundant storage given we already have the list item to enrich. Fetching full content in `listResumes()` — wastes bandwidth; most users never open every resume in a session.

### 3. Hard delete — no `deleted_at` column exists

The `docs_resumes` table has no `deleted_at` column. The `DELETE /api/docs/resumes/:id` endpoint issues a hard `DELETE` statement. Download log rows in `docs_generated_resume_log` are cleaned up automatically via the `ON DELETE CASCADE` FK constraint — no additional cleanup needed.

The endpoint follows existing file-based routing conventions: `server/api/docs/resumes/[id].delete.ts`.

**Note**: Existing `GET`/`PUT` endpoints in the codebase reference a `deleted_at` filter that was never added to the schema. Those stale filters are a pre-existing issue and out of scope for this change.

**Alternatives considered**: Soft delete — would require a migration to add the column and updates to all existing read endpoints to filter it correctly.

### 4. Delete confirmation in UI (no modal component — inline state)

Rather than introducing a modal component dependency, the delete button on each resume card toggles a `confirmingDeleteId` ref. When set, the card shows "Are you sure? [Cancel] [Delete]". This keeps the change self-contained.

**Alternatives considered**: UModal (Nuxt UI) — more polished but adds a component dependency and markup complexity for a single-page use case.

### 5. Error handling belongs in the component

Store actions do not store error state. Actions throw (or re-throw) on failure; the calling component catches and sets its own local `error` ref. Loading/saving flags are always cleared in a `finally` block. This matches existing store conventions.

## Risks / Trade-offs

- **Stale list across tabs**: If another tab creates or deletes a resume, the cached list won't reflect it — acceptable given Non-Goals.
- **Enriched item becomes stale**: If another session updates a resume's content, `getResume(id)` will return the cached version. A `refreshResume(id)` action can force a re-fetch if this becomes a problem.
- **Hard delete is permanent**: No recovery path. Mitigation is the confirmation step in the UI before the action is dispatched.
- **Cascade covers download logs**: `docs_generated_resume_log` rows are removed by the DB via `ON DELETE CASCADE` — no application-level cleanup needed.
- **Migration of page components**: Two pages need to be refactored. Risk of regressions on save/load flows — mitigation is that each page's logic maps 1:1 to a store action, and no behaviour changes are intended.

## Migration Plan

1. Add `server/api/docs/resumes/[id].delete.ts` — no DB migration, no impact on existing endpoints.
2. Add `app/stores/docsStore.ts` — additive, no existing code changes.
3. Migrate `app/pages/docs/resumes/index.vue` — replace local state and `$fetch` with store calls.
4. Migrate `app/pages/docs/resumes/[id].vue` — replace local state and `$fetch` with store calls.
5. Add delete button + confirm UI to `index.vue`.

Each step is independently deployable. Steps 3–5 are the only ones with regression risk; they can be reviewed and tested together.

**Rollback**: Steps 1–2 are purely additive. If steps 3–5 regress, revert those two page files; the store and endpoint remain dormant.

## Open Questions

- Should the delete button be visible only in list view, or also accessible from the editor? Current scope: list view only. Editor delete can be a follow-on change.
