## Why

The `/docs` resume pages manage all data via direct `$fetch` calls and component-local state, making the data layer fragmented and hard to share across pages. There is also no way for users to delete a resume — the API has no delete endpoint and the UI has no delete affordance.

## What Changes

- **New**: `docsStore` Pinia store centralises all resume CRUD operations and caches the resume list and individual resume records, replacing direct `$fetch` calls in pages/components.
- **New**: `DELETE /api/docs/resumes/:id` server endpoint performs a soft delete on a resume record.
- **New**: Delete resume capability exposed in the resume list UI (confirmation before deletion).
- **Modified**: `/docs/resumes/index.vue` migrated from local `$fetch` + local `ref` state to `docsStore` actions.
- **Modified**: `/docs/resumes/[id].vue` migrated from local `$fetch` + local `ref` state to `docsStore` actions; editor writes through the store.

## Capabilities

### New Capabilities
- `docs-store`: Pinia store managing resume list cache, individual resume record cache, and all CRUD actions (list, get, create, update, delete).
- `resume-delete`: Soft-delete a resume — new API endpoint + UI affordance (delete button + confirmation) on the resume list page.

### Modified Capabilities
- `resume-persistence`: The persistence spec currently covers create, read, and update. Adding delete as a first-class operation changes its requirements.

## Impact

- **New file**: `app/stores/docsStore.ts`
- **New file**: `server/api/docs/resumes/[id].delete.ts`
- **Modified**: `app/pages/docs/resumes/index.vue` — use store instead of local fetch/state
- **Modified**: `app/pages/docs/resumes/[id].vue` — use store instead of local fetch/state
- **No breaking API changes** — existing `GET`, `POST`, and `PUT` endpoints are untouched; `DELETE` is additive
- **No schema/DB changes** — soft delete uses existing `deleted_at` column convention
