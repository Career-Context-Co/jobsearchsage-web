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
- [x] Create `server/api/career-id/profile/[profileId]/moments/index.get.ts` - GET all moments for profile
- [x] Create `server/api/career-id/profile/[profileId]/moments/index.post.ts` - POST to create moment(s) (bulk operation)
- [x] Create `server/api/career-id/profile/[profileId]/moments/[momentId].patch.ts` - PATCH to update moment
- [x] Create `server/api/career-id/profile/[profileId]/moments/[momentId].delete.ts` - DELETE moment (soft delete)
- [x] Generate prefixed IDs (`moment_*`)
- [x] Add error handling and logging

**Dependencies:** DB-001, DB-003
**Success criteria:** All endpoints work with curl/Postman; validation rejects invalid data; errors are descriptive
**Testable by:** Backend team (endpoint tests)

---

### BE-002: Discovery Session Endpoints
- [x] Create `server/api/ai/hero-discovery/start.post.ts` - POST to start session
  - Uses Discovery Start Prompt (`context/prompts/Discovery Start Prompt.md`) (copy and paste dont read files)
  - Calls AI to generate opening greeting and question
  - Initializes session state (moments_count: 0, turn_count: 1)
  - Returns: ai_message, session_id
  
- [x] Create `server/api/ai/hero-discovery/continue.post.ts` - POST to continue conversation
  - Uses Discovery Continue Prompt (`context/prompts/Discovery Continue Prompt.md`) (copy and paste dont read files)
  - Receives session_id, user_message and conversation history in request body
  - Calls AI to analyze message and capture moments as discovered
  - Returns: ai_message, moments_captured (if any), should_end_session
  
- [x] Create `server/api/ai/hero-discovery/end.post.ts` - POST to end session
  - Uses Discovery End Prompt (copy and paste dont read files)
  - Summarizes all captured moments with one-liners
  - Guides user to select moment for Story Builder
  - Returns: ai_message, moments_summary, next_endpoint
  
- [x] Track session state: moments_count, turn_count, session_status
  - `session_status` tracked in all endpoints (active → completed)
  - `moment_count` tracked across start/continue/end
- [x] Add error handling and logging
  - All endpoints have comprehensive error handling with DiscoveryError, database errors, API errors
  - Structured logging with logRequest/logError/logSuccess throughout
  - Detailed context logged for debugging (session_id, moments_count, durations, codes)

**Dependencies:** DB-002, BE-001
**Success criteria:** Discovery flow works end-to-end (start → continue → end); moments captured correctly; AI prompts generate contextual responses
**Testable by:** Backend team (test with real AI responses)

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

### FE-001: Hero Discovery Page with Drawer
- [x] Create `app/pages/profile/hero.vue`
- [x] Display list of discovered hero moments (title, notes, date, status)
- [x] Add "Start Discovery Session" button to open drawer
- [x] Implement UDrawer component for discovery session:
  - Controlled via query parameter (`?discover=true`)
  - Opens from right side, inset mode
  - Contains discovery session interface
  - Close button to dismiss drawer
- [x] Mock data for hero moments list (2 sample moments)
- [x] Empty state when no moments exist
- [x] Action buttons on each moment (Develop Story, Delete)
- [x] Implement responsive layout matching other profile pages
- [x] Follow conventions from experience.vue page

**Reference:**
- Pattern follows `app/pages/profile/experience.vue` with EnhancementPane drawer
- Uses query param routing for drawer state management

**Dependencies:** None
**Success criteria:** Hero page displays moments list; drawer opens/closes correctly via query param; mock data displays; responsive layout works; follows profile page conventions
**Testable by:** Frontend team (visual testing)
**COMPLETED** ✅

---

### FE-002: Discovery Session Chat Component
- [x] Create `app/components/profile/HeroDiscoverySessionChat.vue`
- [x] Vertical layout with three sections:
  1. **Top - Info Banner**: Explanation of discovery session and what's happening
  2. **Middle - Captured Moments**: Running list of moments captured so far
     - Display with icons and count badge
     - Show title and raw notes for each moment
     - Empty state if no moments yet
  3. **Bottom - Chat Interface**: Conversation area
     - Display AI messages
     - User input textarea
     - Send button
     - Loading state while waiting for AI response
- [x] Integration with API endpoints:
  - `POST /api/ai/hero-discovery/start` - Initialize session
  - `POST /api/ai/hero-discovery/continue` - Send message and get response
  - `POST /api/ai/hero-discovery/end` - End discovery session
- [x] Accept props: sessionId, profileId
- [x] Emit events: `@close`, `@moment-captured`, `@session-ended`
- [x] Handle session state (active/ended)
- [x] Use mock data for initial testing
- [x] Match styling from EnhancementBulletReview.vue pattern

**API References:**
- Request: `{ session_id, user_message, captured_moments: [] }`
- Response: `{ ai_message, moment_captured?: { title, rawNotes }, should_end_session }`

**Dependencies:** None
**Success criteria:** Three-section layout displays correctly; moments list updates on capture; chat works; API integration functional; responsive layout
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-003: Moment Card Component
- [x] Create `app/components/profile/hero/MomentCard.vue`
- [x] Display:
  - Moment title (5-10 words)
  - First 2 sentences of raw notes (truncated with ellipsis)
  - Discovery timestamp ("Discovered on [date]")
  - Status badge ("Discovered - Not Yet Developed")
  - Edit and Remove buttons (for discovery session)
  - Develop into Story and Remove buttons (for management page)
- [x] Accept props: moment, context (session or management)
- [x] Emit events: `@edit`, `@remove`, `@develop`
- [x] Use mock data for testing

**Dependencies:** None
**Success criteria:** Card displays all information correctly; buttons are visible and clickable
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-004: Discovered Moments Section Component
- [x] Create `app/components/profile/hero/DiscoveredMomentsSection.vue`
- [x] Display:
  - Section title: "Discovered Moments"
  - Count badge: "You have [X] discovered moments"
  - Subtitle: "You can develop these into full HERO stories"
  - List of moment cards (newest first)
  - Empty state if no moments
  - collapsable
- [x] Accept props: moments (array)
- [x] Emit events: `@develop`, `@remove`
- [x] Use mock data for testing
- [x] Add visual styling to distinguish from HERO stories section

**Dependencies:** FE-003
**Success criteria:** Section displays correctly with mock data; empty state works; styling is distinct
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-005: Type Definitions
- [x] Create `app/types/heroMoments/index.ts`
- [x] Define types:
  - HeroMoment (id, profile_id, title, raw_notes, source_experience_id, discovery_session_id, created_at, updated_at, converted_at, converted_story_id)
  - DiscoverySession (id, profile_id, session_status, started_at, ended_at, moment_count)
  - MomentFormData (title, raw_notes, source_experience_id)
- [x] Export all types for use in components and store

**Dependencies:** None
**Success criteria:** Types are complete and match backend DTOs; no TypeScript errors
**Testable by:** Frontend team (type checking)
**COMPLETED** ✅

---

## PHASE 3B: FRONTEND - INTEGRATION

### FE-006: Pinia Store Integration - Hero Moments State
- [x] Update `app/stores/careerIDStore.ts` to add hero moments state:
  - heroMoments (all unconverted moments for profile)
- [x] Add getters:
  - unconvertedMomentsCount
- [x] Hero moments state follows same pattern as experience, education, etc.
- [x] Import HeroMoment and DiscoverySession types from `app/types/heroMoments`

**Dependencies:** FE-005
**Success criteria:** Hero moments state integrated into careerIDStore; types are imported; state is reactive
**Testable by:** Frontend team (unit tests)
**COMPLETED** ✅

---

### FE-007: Store Actions - Discovery Session
- [x] Add `startDiscoverySession(profileId, userContext?)` - POST /api/ai/hero-discovery/start
  - Request body: `{ profile_id, user_context?, source_experience? }`
  - Response: `{ success, ai_message, session_id }`
- [x] Add `continueDiscoverySession(sessionId, userMessage, capturedMoments)` - POST /api/ai/hero-discovery/continue
  - Request body: `{ session_id, user_message, captured_moments: [] }`
  - Response: `{ success, ai_message, moment_captured?, should_end_session }`
- [x] Add `endDiscoverySession(sessionId)` - POST /api/ai/hero-discovery/end
  - Request body: `{ session_id }`
  - Response: `{ success, message }`
- [x] All actions update local state after operations
- [x] Add error handling and logging

**Dependencies:** BE-002, FE-006
**Success criteria:** Actions call correct endpoints with proper request format; state updates correctly; errors are handled
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-008: Store Actions - Moments CRUD
- [x] Add `fetchMoments(profileId)` - GET /api/career-id/profile/:profileId/moments
  - Returns all moments (including unconverted) ordered by created_at (newest first)
  - Updates heroMoments state
- [x] Add `createMoments(profileId, momentsData)` - POST /api/career-id/profile/:profileId/moments
  - Request body: Array of `{ title, rawNotes, sourceExperienceId?, discoverySessionId? }`
  - Response: Array of created moments
- [x] Add `updateMoment(profileId, momentId, momentData)` - PATCH /api/career-id/profile/:profileId/moments/:momentId
  - Request body: `{ title?, rawNotes?, sourceExperienceId? }`
  - Updates local state after operation
- [x] Add `deleteMoment(profileId, momentId)` - DELETE /api/career-id/profile/:profileId/moments/:momentId
  - Performs soft delete
  - Updates local state after operation
- [x] All actions include error handling and logging

**Dependencies:** BE-001, BE-003, FE-006, FE-007
**Success criteria:** Actions call correct endpoints with proper request/response format; state updates correctly; moments are added/updated/removed
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-009: Store Actions - Session Persistence
- [x] Add `saveSessionToCache(session)` - Save session state to localStorage/IndexedDB
- [x] Add `restoreSessionFromCache()` - Restore session state from cache
- [x] Add `clearSessionCache()` - Clear cached session data
- [x] Add `syncSessionWithServer(sessionId)` - Sync cached session with server
- [x] Implement auto-sync after each moment operation
- [x] Handle cache expiration (old sessions)

**Dependencies:** FE-007, FE-008
**Success criteria:** Session state persists across page refreshes; cache syncs with server; old sessions are cleaned up
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-010: Discovery Session Component Integration
- [x] Update `app/components/profile/hero/DiscoverySessionChat.vue` to:
  - Accept `sessionId`, `profileId` as props
  - Accept `isLoading`, `error` as props from parent
  - Display UI for discovery session (info banner, captured moments, chat)
  - Emit `@close` when user closes the session
  - Emit `@send-message` with `{ userMessage, capturedMoments }` when user submits
  - Emit `@end-session` when user ends the session
  - Display AI responses passed via props
  - Show loading states while parent is fetching/processing
  - Display error messages passed via props
  - Update UI with captured moments passed via props
- [x] Component is pure - no store calls, only emits events
- [x] Parent page handles all store integration

**Dependencies:** FE-001, FE-005
**Success criteria:** Component displays correctly; emits correct events with proper data; accepts props for loading/error/responses
**Testable by:** Frontend team (integration tests)
**COMPLETED** ✅

---

### FE-011: Discovered Moments Section Component Integration
- [x] Update `app/components/profile/hero/DiscoveredMomentsSection.vue` to:
  - Accept `moments` (array) as prop from parent
  - Accept `isLoading`, `error` as props from parent
  - Emit `@start-session` when user clicks "Discover More" button
  - Emit `@develop` with `moment` when user develops a moment into a story
  - Emit `@remove` with `moment` when user removes a moment
  - Display moments list passed via props
  - Show loading states while parent is fetching/processing
  - Display error messages passed via props
  - Component is pure - no store calls, only emits events
- [x] Parent page (hero.vue) handles all store integration and event responses

**Dependencies:** FE-004, FE-005
**Success criteria:** Component displays moments correctly; emits correct events with proper data; accepts props for loading/error/moments
**Testable by:** Frontend team
**COMPLETED** ✅

---

### FE-012: HERO Discovery Page Integration
- [x] Update `app/pages/profile/hero.vue` to:
  - Import `useCareerIDStore` and get profile/session data from store
  - **Discovery Session Management:**
    - Call `store.startDiscoverySession(profileId, userContext)` when opening drawer
    - Call `store.continueDiscoverySession(sessionId, userMessage, capturedMoments)` on discovery chat message
    - Call `store.endDiscoverySession(sessionId)` when ending session
    - Pass loading and error states to DiscoverySessionChat component
  - **Moments Management:**
    - Call `store.fetchMoments(profileId)` on page mount to load all moments
    - Call `store.deleteMoment(profileId, momentId)` when user removes a moment
    - Call `store.updateMoment(profileId, momentId, data)` when user edits a moment
  - Pass moments array from store to DiscoveredMomentsSection component
  - Pass loading/error states to both components
  - Handle @develop event (TODO: navigate to Story Builder)
  - Handle @remove event (call store delete action)
  - Handle @start-session event (open discovery drawer and start session)
  - Handle @send-message event from chat (call store continue action)
  - Handle @close event (close drawer)
  - Handle @end-session event (close drawer after ending)
  - Handle @moment-captured event (add to local list)
- [x] Add loading indicators for all async operations
- [x] Add error message display with retry options
- [x] Implement proper state management for discovery session lifecycle

**Dependencies:** FE-010, FE-011, FE-006, FE-007, FE-008, FE-009
**Success criteria:** Page handles all store calls correctly; moments update in real-time; loading/error states display; all events handled properly
**Testable by:** Frontend team (full integration test)
**COMPLETED** ✅

---

### FE-013: Moment Edit Form Integration
- [x] Display edit form with:
  - Title input (editable, max 50 chars)
  - Raw notes textarea (editable, max 500 chars)
  - Save and Cancel buttons
- [x] Accept props: moment
- [x] Emit events: `@save`, `@cancel`
- [x] Call store action to update moment on save

**Dependencies:** FE-010
**Success criteria:** Form displays correctly; updates work; changes are persisted
**Testable by:** Frontend team
**COMPLETED** ✅

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
