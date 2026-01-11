# Tasks: Hero Moments Discovery

## USER STORY: Hero Moments Discovery

**Context:** JobSearchSage - Users capture lightweight achievement moments during discovery sessions, then develop them into full HERO stories at their own pace.

**Key Constraints:**
- Moments are minimal: title (5-10 words) + raw notes (2-4 sentences)
- Discovery sessions are stateful and survive page refreshes
- Moments are stored in `career_id` schema
- Moments are distinct from completed HERO stories in the UI
- No AI integration in this phase (placeholder for future)

---

## PHASE 1: DATABASE

### DB-001: Hero Moments Table
- [x] Design `career_id.hero_moments` table (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, updated_at, deleted_at, converted_at, converted_story_id)
- [x] Create migration: `deliverables/migrations/020_create_hero_moments.sql`
- [x] Add indexes on profile_id, discovery_session_id, converted_story_id
- [x] Document schema in `deliverables/schemas/hero-moments-schema.md`

**Dependencies:** None (but assumes hero_stories table exists from 2026-01-10-add-hero-stories)
**Success criteria:** Table created with all columns, indexes, and foreign keys; migration is idempotent
**Testable by:** Database team (verify table structure, apply migration)

---

### DB-002: Discovery Sessions Table
- [x] Alter existing `public.hero_discovery_sessions` table to add missing columns (session_status, moment_count)
- [x] Create migration: `deliverables/migrations/021_alter_discovery_sessions.sql` to add columns and indexes
- [x] Add indexes on profile_id, session_status

**Dependencies:** DB-001
**Success criteria:** Table has all required columns and indexes; tracks session lifecycle; foreign key constraint added
**Testable by:** Database team

---

## PHASE 2: BACKEND

### BE-001: Moments CRUD Endpoints
- [ ] Create `server/api/career-id/profile/[profileId]/moments/index.get.ts` - GET all unconverted moments
- [ ] Create `server/api/career-id/profile/[profileId]/moments/index.post.ts` - POST to create moment
- [ ] Create `server/api/career-id/profile/[profileId]/moments/[momentId].get.ts` - GET single moment
- [ ] Create `server/api/career-id/profile/[profileId]/moments/[momentId].patch.ts` - PATCH to update moment
- [ ] Create `server/api/career-id/profile/[profileId]/moments/[momentId].delete.ts` - DELETE moment (soft delete)
- [ ] Generate prefixed IDs (`moment_*`)
- [ ] Add validation: title length (5-50 chars), raw_notes length (10-500 chars), required fields
- [ ] Add error handling and logging
- [ ] Document in `deliverables/schemas/api-spec.md`

**Dependencies:** DB-001, DB-003
**Success criteria:** All endpoints work with curl/Postman; validation rejects invalid data; errors are descriptive
**Testable by:** Backend team (endpoint tests)

---

### BE-002: Discovery Session Endpoints
- [ ] Create `server/api/career-id/discovery-sessions/index.post.ts` - POST to start session
- [ ] Create `server/api/career-id/discovery-sessions/[sessionId].get.ts` - GET session state
- [ ] Create `server/api/career-id/discovery-sessions/[sessionId].patch.ts` - PATCH to update session (add/remove moments)
- [ ] Create `server/api/career-id/discovery-sessions/[sessionId]/end.post.ts` - POST to end session
- [ ] Generate prefixed IDs (`session_*`)
- [ ] Add validation: profile_id required, session_status valid values
- [ ] Add error handling and logging
- [ ] Document in `deliverables/schemas/api-spec.md`

**Dependencies:** DB-002, BE-001
**Success criteria:** Sessions can be created, retrieved, updated, and ended; state is persisted correctly
**Testable by:** Backend team

---

### BE-003: Moment Conversion Endpoints
- [ ] Create `server/api/career-id/profile/[profileId]/moments/[momentId]/convert.post.ts` - POST to mark moment as converted
- [ ] Add validation: moment exists, story_id is valid, moment not already converted
- [ ] Call `career_id.mark_moment_converted()` function
- [ ] Return updated moment with conversion metadata
- [ ] Add error handling and logging
- [ ] Document in `deliverables/schemas/api-spec.md`

**Dependencies:** DB-003, BE-001
**Success criteria:** Endpoint correctly marks moment as converted; returns updated moment; prevents double conversion
**Testable by:** Backend team

---

### BE-004: Error Handling & API Documentation
- [ ] Create `deliverables/schemas/api-spec.md` with all moments and discovery session endpoints
- [ ] Create `deliverables/schemas/hero-moments-types.ts` with TypeScript DTOs:
  - HeroMoment (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, updated_at, converted_at, converted_story_id)
  - DiscoverySession (id, profile_id, session_status, started_at, ended_at, moment_count)
  - MomentFormData (title, raw_notes, source_experience_id)
- [ ] Create `deliverables/schemas/mocks/moments-requests.json` with sample API requests
- [ ] Create `deliverables/schemas/mocks/moments-responses.json` with sample API responses
- [ ] Document error codes and validation rules

**Dependencies:** BE-001, BE-002, BE-003
**Success criteria:** All endpoints documented with request/response examples; DTOs are complete and type-safe
**Testable by:** Backend team (documentation review)

---

## PHASE 3A: FRONTEND - MOCK UI

### FE-001: Discovery Session Page
- [ ] Create `app/pages/profile/discovery.vue`
- [ ] Layout with:
  - Question prompt area (static placeholder for AI coach)
  - User input textarea for achievement narrative
  - Running list of captured moments (newest first)
  - Session controls (Continue, Edit, Remove, End Session buttons)
- [ ] Use mock data for moments
- [ ] Implement moment card display (title, first 1-2 sentences, timestamp)
- [ ] Implement empty state ("No moments captured yet")
- [ ] Add visual styling to distinguish from other pages

**Dependencies:** None
**Success criteria:** Page renders with mock data; all UI elements visible; responsive layout
**Testable by:** Frontend team (visual testing)

---

### FE-002: Moment Capture Form Component
- [ ] Create `app/components/profile/MomentCaptureForm.vue`
- [ ] Display confirmation form with:
  - Title input (editable, max 50 chars)
  - Raw notes textarea (editable, max 500 chars)
  - Approve, Edit, Reject buttons
- [ ] Show character counts for title and notes
- [ ] Implement form validation (required fields, length limits)
- [ ] Emit events: `@approve`, `@reject`, `@edit`
- [ ] Use mock data for testing

**Dependencies:** None
**Success criteria:** Form displays correctly; validation works; events emit properly
**Testable by:** Frontend team

---

### FE-003: Moment Card Component
- [ ] Create `app/components/profile/MomentCard.vue`
- [ ] Display:
  - Moment title (5-10 words)
  - First 2 sentences of raw notes (truncated with ellipsis)
  - Discovery timestamp ("Discovered on [date]")
  - Status badge ("Discovered - Not Yet Developed")
  - Edit and Remove buttons (for discovery session)
  - Develop into Story and Remove buttons (for management page)
- [ ] Accept props: moment, context (session or management)
- [ ] Emit events: `@edit`, `@remove`, `@develop`
- [ ] Use mock data for testing

**Dependencies:** None
**Success criteria:** Card displays all information correctly; buttons are visible and clickable
**Testable by:** Frontend team

---

### FE-004: Discovered Moments Section Component
- [ ] Create `app/components/profile/DiscoveredMomentsSection.vue`
- [ ] Display:
  - Section title: "Discovered Moments"
  - Count badge: "You have [X] discovered moments"
  - Subtitle: "You can develop these into full HERO stories"
  - List of moment cards (newest first)
  - Empty state if no moments
- [ ] Accept props: moments (array)
- [ ] Emit events: `@develop`, `@remove`
- [ ] Use mock data for testing
- [ ] Add visual styling to distinguish from HERO stories section

**Dependencies:** FE-003
**Success criteria:** Section displays correctly with mock data; empty state works; styling is distinct
**Testable by:** Frontend team

---

### FE-005: Type Definitions
- [ ] Create `app/types/heroMoments/index.ts`
- [ ] Define types:
  - HeroMoment (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, updated_at, converted_at, converted_story_id)
  - DiscoverySession (id, profile_id, session_status, started_at, ended_at, moment_count)
  - MomentFormData (title, raw_notes, source_experience_id)
- [ ] Export all types for use in components and store

**Dependencies:** None
**Success criteria:** Types are complete and match backend DTOs; no TypeScript errors
**Testable by:** Frontend team (type checking)

---

## PHASE 3B: FRONTEND - INTEGRATION

### FE-006: Pinia Store Setup
- [ ] Create `app/stores/heroMomentsStore.ts`
- [ ] Define state:
  - activeSession (current discovery session)
  - discoveredMoments (all unconverted moments for profile)
  - sessionMoments (moments in active session)
  - isLoading, isSaving, error
- [ ] Add getters:
  - unconvertedMomentsCount
  - sessionMomentsCount
  - isSessionActive
  - hasError
- [ ] Add lifecycle actions: resetStore, setError, clearError

**Dependencies:** None
**Success criteria:** Store initializes correctly; state is reactive; getters work
**Testable by:** Frontend team (unit tests)

---

### FE-007: Store Actions - Discovery Session
- [ ] Add `startDiscoverySession(profileId)` - POST /api/career-id/discovery-sessions
- [ ] Add `getDiscoverySession(sessionId)` - GET /api/career-id/discovery-sessions/:sessionId
- [ ] Add `endDiscoverySession(sessionId)` - POST /api/career-id/discovery-sessions/:sessionId/end
- [ ] Add `updateSessionStatus(sessionId, status)` - PATCH /api/career-id/discovery-sessions/:sessionId
- [ ] All actions update local state after operations
- [ ] Add error handling and logging

**Dependencies:** BE-002, FE-006
**Success criteria:** Actions call correct endpoints; state updates correctly; errors are handled
**Testable by:** Frontend team

---

### FE-008: Store Actions - Moments CRUD
- [ ] Add `createMoment(profileId, momentData)` - POST /api/career-id/profile/:profileId/moments
- [ ] Add `updateMoment(profileId, momentId, momentData)` - PATCH /api/career-id/profile/:profileId/moments/:momentId
- [ ] Add `deleteMoment(profileId, momentId)` - DELETE /api/career-id/profile/:profileId/moments/:momentId
- [ ] Add `fetchUnconvertedMoments(profileId)` - GET /api/career-id/profile/:profileId/moments
- [ ] Add `convertMoment(profileId, momentId, storyId)` - POST /api/career-id/profile/:profileId/moments/:momentId/convert
- [ ] All actions update local state after operations
- [ ] Add error handling and logging

**Dependencies:** BE-001, BE-003, FE-006, FE-007
**Success criteria:** Actions call correct endpoints; state updates correctly; moments are added/updated/removed
**Testable by:** Frontend team

---

### FE-009: Store Actions - Session Persistence
- [ ] Add `saveSessionToCache(session)` - Save session state to localStorage/IndexedDB
- [ ] Add `restoreSessionFromCache()` - Restore session state from cache
- [ ] Add `clearSessionCache()` - Clear cached session data
- [ ] Add `syncSessionWithServer(sessionId)` - Sync cached session with server
- [ ] Implement auto-sync after each moment operation
- [ ] Handle cache expiration (old sessions)

**Dependencies:** FE-007, FE-008
**Success criteria:** Session state persists across page refreshes; cache syncs with server; old sessions are cleaned up
**Testable by:** Frontend team

---

### FE-010: Discovery Session Page Integration
- [ ] Update `app/pages/profile/discovery.vue` to:
  - Fetch or create discovery session on mount
  - Connect to heroMomentsStore
  - Display session moments from store
  - Call store actions for create/update/delete moment
  - Call store action to end session
  - Restore session from cache on page refresh
  - Display loading states and errors
- [ ] Implement session state persistence
- [ ] Add success confirmations for moment capture
- [ ] Add error messages for failed operations

**Dependencies:** FE-001, FE-006 through FE-009
**Success criteria:** Page integrates with store; moments are created/updated/deleted; session persists across refresh
**Testable by:** Frontend team (integration tests)

---

### FE-011: Discovered Moments Section Integration
- [ ] Update `app/components/profile/DiscoveredMomentsSection.vue` to:
  - Accept moments from parent (HERO management page)
  - Call store action to fetch unconverted moments on mount
  - Emit events for develop and remove actions
  - Handle loading and error states
  - Display moment count from store
- [ ] Integrate with HERO management page
- [ ] Add loading indicators while fetching moments
- [ ] Add error messages if fetch fails

**Dependencies:** FE-004, FE-006 through FE-009
**Success criteria:** Component fetches and displays moments; actions work correctly; errors are handled
**Testable by:** Frontend team

---

### FE-012: HERO Management Page Integration
- [ ] Update HERO management page to:
  - Import and display DiscoveredMomentsSection component
  - Pass moments from store to component
  - Handle develop action (navigate to Story Builder with moment context)
  - Handle remove action (call store delete action)
  - Display both Discovered Moments and Your HERO Stories sections
  - Show conversion metrics ("You have X moments, Y developed into stories")
- [ ] Ensure sections are visually distinct
- [ ] Add loading states for both sections

**Dependencies:** FE-011
**Success criteria:** Management page displays both sections; moments and stories are distinct; actions work
**Testable by:** Frontend team (full integration test)

---

### FE-013: Moment Edit Form Integration
- [ ] Create `app/components/profile/MomentEditForm.vue`
- [ ] Display edit form with:
  - Title input (editable, max 50 chars)
  - Raw notes textarea (editable, max 500 chars)
  - Save and Cancel buttons
- [ ] Accept props: moment
- [ ] Emit events: `@save`, `@cancel`
- [ ] Integrate with discovery session page
- [ ] Call store action to update moment on save

**Dependencies:** FE-010
**Success criteria:** Form displays correctly; updates work; changes are persisted
**Testable by:** Frontend team

---

### FE-014: Confirmation Dialogs & UX
- [ ] Add confirmation dialog for removing moments
- [ ] Add confirmation dialog for ending session with no moments
- [ ] Add success toast for moment capture
- [ ] Add success toast for moment removal
- [ ] Add error toast for failed operations
- [ ] Add loading indicators for all async operations
- [ ] Display "Saved" indicator after successful operations

**Dependencies:** FE-010 through FE-013
**Success criteria:** All dialogs and toasts display correctly; UX is smooth and responsive
**Testable by:** Frontend team (manual testing)

---

## Summary

**Total Tasks:** 14 (3 DB + 4 BE + 5 FE Mock + 6 FE Integration)

**Critical Path:**
1. DB-001, DB-002, DB-003 (database foundation)
2. BE-001, BE-002, BE-003, BE-004 (backend endpoints)
3. FE-001 through FE-005 (mock UI, can start in parallel with backend)
4. FE-006 through FE-014 (integration, depends on backend)

**Parallelizable Work:**
- FE-001 through FE-005 can be built in parallel with BE-001 through BE-004
- FE-006 through FE-009 can be built in parallel with FE-001 through FE-005

**Estimated Effort:**
- Database: 1-2 days
- Backend: 2-3 days
- Frontend Mock: 2-3 days (parallel with backend)
- Frontend Integration: 3-4 days
- **Total: 8-12 days**
