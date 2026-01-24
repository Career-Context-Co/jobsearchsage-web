# Tasks: Add HERO Story Form

## USER STORY: HERO Story Form

**Context:** JobSearchSage - Users capture complete HERO stories using a single-page form (no guided flow) with manual save and clear post-save actions.

**Key Constraints:**
- One-page form with all HERO sections and tagged fields
- Title is required
- No autosave and no AI calls
- Persist to `career_id.hero_stories` (existing table)
- Routes:
  - New story: `/profile/hero?new`
  - Edit story: `/profile/hero/:storyId`

---

## PHASE 1: DATABASE

### DB-001: Confirm `career_id.hero_stories` schema + access patterns ✅ COMPLETE
- [x] Verify `career_id.hero_stories` columns match form fields (title + 12 tagged columns + source_experience_id + timestamps + soft delete)
- [x] Confirm expected ID format (`story_*`) and creation strategy (server-generated via backend)
- [x] Document schema mapping in `openspec/changes/add-hero-story-form/design.md` (keep in sync with Supabase)

**Dependencies:** None
**Success criteria:** ✅ Schema mapping is accurate and required fields are defined for backend validation

**Verification Details (via Supabase MCP):**
- ✅ Table exists: `career_id.hero_stories` with 24 columns
- ✅ ID format: TEXT prefixed ID (e.g., `story_clx2k9j3m0000`) + internal BIGINT identity
- ✅ All 12 HERO tagged fields present as nullable TEXT: `hurdle_problem`, `hurdle_scope`, `hurdle_stakes`, `expectation_role`, `expectation_goals`, `expectation_constraints`, `response_actions`, `response_tools`, `response_challenges`, `outcome_deliverable`, `outcome_metrics`, `outcome_impact`
- ✅ Required fields: `title` (NOT NULL), `profile_id` (NOT NULL)
- ✅ Soft delete: Both `deleted_at` (TIMESTAMPTZ) and `is_deleted` (BOOLEAN DEFAULT false) columns
- ✅ Relationships: `source_experience_id` FK to experience(id), `profile_id` FK to profiles(id)
- ✅ Indexes: idx_hero_stories_profile_id for efficient profile queries
- ✅ Timestamps: created_at, updated_at with NOW() defaults

---

## PHASE 2: BACKEND ✅ COMPLETE

### BE-001: Hero stories CRUD endpoints ✅ COMPLETE
- [x] Create `POST /api/career-id/profile/:profileId/hero-stories` to create a story
- [x] Create `GET /api/career-id/profile/:profileId/hero-stories` to list stories (non-deleted)
- [x] Create `GET /api/career-id/profile/:profileId/hero-stories/:storyId` to fetch single story
- [x] Create `PATCH /api/career-id/profile/:profileId/hero-stories/:storyId` to update a story
- [x] Create `DELETE /api/career-id/profile/:profileId/hero-stories/:storyId` for soft delete (`deleted_at`, `is_deleted`)
- [x] Validate:
  - `title` required on create; must trim and handle optional on update
  - `profileId` matches story owner on read/update/delete
  - `source_experience_id` optional integer and verified to exist (FK constraint)
- [x] Return saved story with generated `id` in response (for routing and navigation)
- [x] Implement soft delete pattern: set `deleted_at` timestamp AND `is_deleted = true` flag
- [x] List endpoint filters `is_deleted = false` and orders by `display_order`, then `created_at` DESC
- [x] All endpoints use Supabase client with schema('career_id') prefix
- [x] Transform snake_case DB fields to camelCase in responses
- [x] Comprehensive logging with duration tracking for all endpoints

**Dependencies:** DB-001
**Success criteria:** ✅ All 5 endpoints implemented, validated, and follow existing patterns

**Implementation Details:**
- **POST** (`index.post.ts`): Generates prefixed ID (`story_*`), accepts all HERO fields + sourceExperienceId, trims text, returns 201 Created
- **GET list** (`index.get.ts`): Fetches all active stories for profile, ordered by display_order then created_at DESC
- **GET single** (`[storyId].get.ts`): Fetches specific story, validates ownership, uses `.maybeSingle()` for clean not-found handling
- **PATCH** (`[storyId].patch.ts`): Updates only provided fields, validates title if provided, validates sourceExperienceId if provided
- **DELETE** (`[storyId].delete.ts`): Soft deletes by setting `deleted_at` ISO timestamp + `is_deleted = true`
- All endpoints follow hero-moments pattern for consistency
- Error handling via `handleDatabaseError`, validation via `createValidationError`
- camelCase response transformation for all endpoints

**Files Created:**
- `server/api/career-id/profile/[profileId]/hero-stories/index.post.ts` (create story)
- `server/api/career-id/profile/[profileId]/hero-stories/index.get.ts` (list stories)
- `server/api/career-id/profile/[profileId]/hero-stories/[storyId].get.ts` (fetch story)
- `server/api/career-id/profile/[profileId]/hero-stories/[storyId].patch.ts` (update story)
- `server/api/career-id/profile/[profileId]/hero-stories/[storyId].delete.ts` (delete story)

**Test Scripts:**
- `openspec/changes/add-hero-story-form/deliverables/HERO_Stories_CRUD.postman_collection.json` - Ready-to-import Postman Collection with all endpoints, tests, and example responses
- `openspec/changes/add-hero-story-form/deliverables/TEST_INSTRUCTIONS.md` - Testing guide and reference documentation

---

## PHASE 3A: FRONTEND - MOCK UI

### FE-001: HERO Story Form UI (create/edit)
- [x] Create story form UI (page or component) that displays:
  - Title input (required)
  - Four sections: Hurdle / Expectation / Response / Outcome
  - Inputs for all 12 tagged fields
- [x] Add read-only context panel support (moment or experience) without persistence
- [x] Add Save button states (disabled when title empty, loading state)

**Dependencies:** None
**Success criteria:** ✅ Form renders and is usable with mock data; layout supports non-linear editing; matches existing profile form styles (inline edit pattern)

### FE-002: Routing behavior for new + existing stories
- [ ] Support `/profile/hero?new` to open “new story” form state
- [ ] Support `/profile/hero/:storyId` to open “edit story” state (mock load)

**Dependencies:** FE-001
**Success criteria:** Navigation between list → new → edit works via routes

### FE-003: HERO list page section for “Your HERO Stories” (mock)
- [ ] Add a “Your HERO Stories” section to `/profile/hero` that displays story cards (mock data)
- [ ] Ensure the page shows both “Your HERO Stories” and “Discovered Moments”
- [ ] Add click behavior (mock) that navigates to `/profile/hero/:storyId`

**Dependencies:** None
**Success criteria:** `/profile/hero` clearly shows both sections and can navigate to a story route

---

## PHASE 3B: FRONTEND - INTEGRATION

### FE-004: Store actions for hero stories
- [ ] Add store state for current hero story (loaded/edited) and save status
- [ ] Add actions:
  - createStory(profileId, payload)
  - fetchStories(profileId)
  - fetchStory(profileId, storyId)
  - updateStory(profileId, storyId, payload)
  - deleteStory(profileId, storyId)
- [ ] Ensure Save uses explicit user action only (no watcher-driven calls)

**Dependencies:** BE-001, FE-001
**Success criteria:** Store actions call the new endpoints and return story ID on create

### FE-005: Wire form to backend + post-save navigation
- [ ] On save success, show confirmation feedback
- [ ] Provide “View story” action that navigates to `/profile/hero/:storyId`
- [ ] Provide “Generate bullets” CTA with “Coming soon” (no functionality in this change)
- [ ] Provide “Back to list” action that navigates to `/profile/hero`
- [ ] Ensure error handling retains unsaved form data

**Dependencies:** FE-002, FE-004
**Success criteria:** End-to-end create + edit saves work and navigate to view story after save

### FE-006: HERO list page integration (stories + moments)
- [ ] Load stories on `/profile/hero` and render “Your HERO Stories” section from store state
- [ ] Ensure discovered moments section continues to work alongside stories
- [ ] Clicking a story navigates to `/profile/hero/:storyId`

**Dependencies:** FE-003, FE-004
**Success criteria:** `/profile/hero` shows real stories + real moments and can open a story for editing

### FE-007: Wire “Develop” entry points into story form
- [ ] Update `app/pages/profile/hero.vue` “Develop” action to navigate to `/profile/hero?new` with origin context (query params or state)
- [ ] Pre-fill title when originating from a moment (client-side)
- [ ] Set `source_experience_id` when originating from an experience (send on save)

**Dependencies:** FE-002, FE-005
**Success criteria:** User can start story from a moment/experience and see context + correct prefill

