# Tasks: Add HERO Story Form

## USER STORY: HERO Story Form

**Context:** JobSearchSage - Users capture complete HERO stories using a single-page form (no guided flow) with manual save and clear post-save actions.

**Key Constraints:**
- One-page form with all HERO sections and tagged fields
- Title is required
- No autosave and no AI calls
- Persist to `career_id.hero_stories` (existing table)
- Inline editing with collapsible cards (like MomentCard pattern)
- No dedicated routes for edit - all editing happens within the card component

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

## PHASE 3A: FRONTEND - MOCK UI ✅ COMPLETE

### FE-001: HERO Story Form UI (create/edit) ✅ COMPLETE
- [x] Create story form UI (page-level component) that displays:
  - Title input (required)
  - Four sections: Hurdle / Expectation / Response / Outcome
  - Inputs for all 12 tagged fields
- [x] Create inline edit card component (`HeroStoryCard.vue`) that mirrors `MomentCard.vue` pattern:
  - View mode: Shows story title + timestamp
  - Edit mode: Shows full form within the card (no page replacement)
  - Toggle between view/edit without hiding rest of UI
- [x] Add Save button states (disabled when title empty)
- [x] Match existing profile form styles and spacing

**Dependencies:** None
**Success criteria:** ✅ Form renders and is usable with mock data; inline edit pattern matches MomentCard; card can expand/collapse for editing without replacing page content

**Implementation Details:**
- Page-level create form: `/app/pages/profile/hero.vue` - managed via `isShowingCreateForm` ref
- Inline edit card: `/app/components/profile/hero/HeroStoryCard.vue` - manages `isEditing` ref locally
- Both use compact label styling (text-base) and grouped HERO sections with border separators
- Save triggers `@save` emit with story updates back to page

### FE-002: Routing behavior for new + existing stories ✅ COMPLETE
- [x] Support inline "Create Story" button that shows form at page level
- [x] Support inline edit via pencil button on story cards (no route changes)
- [x] Form cancel returns to list view without navigation

**Dependencies:** FE-001
**Success criteria:** ✅ Create/edit flow works entirely on `/profile/hero` without route changes

**Implementation Details:**
- Create: `startAddingStory()` → `isShowingCreateForm = true` → form visible, section hidden
- Edit: Story card's `startEditing()` → card's `isEditing = true` → edit form appears inline
- Cancel: Resets state flags → view/list mode restored
- No page navigation occurs

### FE-003: HERO list page section for "Your HERO Stories" (mock) ✅ COMPLETE
- [x] Add `HeroStoriesSection.vue` component (mirrors `DiscoveredMomentsSection.vue` pattern)
- [x] Section displays story cards using `ProfileHeroStoryCard` component
- [x] Collapsible header with "Your HERO Stories" title + count badge
- [x] "Create Story" CTA button in section header
- [x] Ensure page shows both "Your HERO Stories" and "Discovered Moments" sections
- [x] Story cards render with inline edit on card click (no navigation)

**Dependencies:** None
**Success criteria:** ✅ `/profile/hero` clearly shows both sections; stories display inline without page navigation

**Implementation Details:**
- Component: `/app/components/profile/hero/HeroStoriesSection.vue`
- Collapsible header with icon chevron toggle
- Count badge showing number of stories
- "Create Story" button in header (matches DiscoveredMomentsSection style)
- Maps story list to ProfileHeroStoryCard components
- Cards handle inline editing locally via `isEditing` state

**Files Created:**
- `/app/components/profile/hero/HeroStoriesSection.vue` - Collapsible section component
- Refactored `/app/components/profile/hero/HeroStoryCard.vue` - Inline edit card component
- Updated `/app/pages/profile/hero.vue` - Main page with create form and section integration

---

## PHASE 3B: FRONTEND - INTEGRATION

### FE-004: Store actions for hero stories
- [x] Add store state for hero stories list and save status
- [x] Add actions:
  - createStory(profileId, payload)
  - fetchStories(profileId)
  - updateStory(profileId, storyId, payload)
  - deleteStory(profileId, storyId)
- [x] Ensure Save uses explicit user action only (no watcher-driven calls)

**Dependencies:** BE-001, FE-001
**Success criteria:** Store actions call the new endpoints and return story ID on create; list is updated after operations

### FE-005: Wire form to backend + save feedback
- [x] Connect create form in hero.vue to backend via store
- [x] Connect card edit form to backend via store
- [x] On save success, show confirmation toast/feedback
- [x] Update story list after successful create/update
- [x] Handle errors gracefully and retain unsaved form data

**Dependencies:** FE-002, FE-004
**Success criteria:** Creating and editing stories persists to database; user gets success/error feedback

### FE-006: HERO list page integration (stories + moments)
- [x] Load stories on `/profile/hero` via store and pass to HeroStoriesSection
- [x] Render "Your HERO Stories" section with real data from store
- [x] Ensure discovered moments section continues to work alongside stories
- [x] Both sections visible simultaneously on the page

**Dependencies:** FE-003, FE-004
**Success criteria:** `/profile/hero` shows real stories + real moments side-by-side; inline editing works with real data

### FE-007: Wire "Develop" entry point from moments
- [x] Update moment card's "Develop into HERO Story" action to trigger create form
- [x] Pre-fill title from moment when originating from discovered moment (client-side)
- [x] Optional: Set `source_experience_id` when originating from an experience

**Dependencies:** FE-004, FE-005
**Success criteria:** User can develop a moment into a story with title pre-filled; context is captured
