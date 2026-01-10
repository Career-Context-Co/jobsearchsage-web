# Design: Hero Moments Discovery

## Context

Hero Moments Discovery is a lightweight feature that captures raw achievement moments during guided discovery sessions. It serves as the entry point to the HERO Stories workflow, allowing users to discover and explore multiple achievements without the pressure of completing full stories immediately.

**Key Constraints:**
- Moments are minimal: title (5-10 words) + raw notes (2-4 sentences)
- Moments are captured during discovery sessions, not edited after session ends
- Moments can be edited on the management page after session completion
- Moments are stored in the `career_id` schema alongside other profile data
- Discovery sessions are stateful and must survive page refreshes
- Moments are distinct from completed HERO stories in the UI

## Goals

- Enable users to quickly capture achievement moments without friction
- Provide a pressure-free discovery experience focused on exploration
- Allow users to discover 3-5 moments in a single session
- Display moments clearly on the HERO management page
- Track moment-to-story conversion for analytics
- Preserve session state across page refreshes

## Non-Goals

- AI-guided discovery (placeholder for future AI coach integration)
- Bulk moment operations or batch generation
- Moment templates or presets
- Version history or rollback functionality
- Moment sharing or collaboration features
- Mobile-specific discovery UI (web only for this phase)

## Decisions

### 1. Moment Structure: Minimal Capture

**Decision:** Moments capture only:
- `title` (5-10 words, required)
- `raw_notes` (2-4 sentences, required)
- `source_experience_id` (optional FK to experience entry)
- `discovery_session_id` (tracks which session created the moment)
- `created_at`, `converted_at`, `converted_story_id` (for tracking conversion)

**Rationale:** Minimal structure reduces friction and cognitive load. Users can expand moments into full HERO stories later using the Story Builder.

**Alternatives Considered:**
- Capture all 12 HERO fields - Would increase friction and pressure
- Capture only title - Would lose valuable context for story development
- Capture with AI extraction - Out of scope for this phase

### 2. Discovery Session: Stateful Conversation

**Decision:** Discovery sessions are stateful conversations that:
- Persist across page refreshes (cached locally until completion)
- Display a running list of captured moments
- Allow editing/removing moments before session ends
- End with a summary showing all discovered moments

**Rationale:** Stateful sessions allow users to:
- Discover multiple moments without losing progress
- Review and refine moments before committing
- Resume if interrupted
- See progress and momentum

**Alternatives Considered:**
- Stateless moments - Would lose session context and progress
- Auto-save each moment - Would create incomplete moments in database

### 3. Data Model: Separate Moments Table

**Decision:** Hero moments are stored in a dedicated `career_id.hero_moments` table with:
- `id` (prefixed with `moment_`)
- `profile_id` (foreign key to profiles)
- `title` (user-provided or system-extracted)
- `raw_notes` (conversational narrative)
- `source_experience_id` (optional FK to experience)
- `discovery_session_id` (FK to discovery session)
- `created_at`, `updated_at`, `deleted_at` (soft delete)
- `converted_at`, `converted_story_id` (tracks conversion to story)
- `display_order` (for ordering in UI)

**Rationale:** Separate table allows:
- Moments to exist independently of stories
- Tracking of discovery and conversion metrics
- Soft delete for removed moments
- Clear lifecycle management

**Alternatives Considered:**
- Store moments in hero_stories table with status field - Would couple moments to stories
- Store moments as JSONB in discovery_sessions - Would lose queryability and analytics

### 4. API Design: RESTful Moments Endpoints

**Decision:** Moment management follows RESTful patterns:
- `GET /api/career-id/profile/:profileId/moments` - List all unconverted moments
- `POST /api/career-id/profile/:profileId/moments` - Create moment
- `GET /api/career-id/profile/:profileId/moments/:momentId` - Get single moment
- `PATCH /api/career-id/profile/:profileId/moments/:momentId` - Update moment
- `DELETE /api/career-id/profile/:profileId/moments/:momentId` - Delete moment (soft delete)

**Discovery Session Endpoints:**
- `POST /api/career-id/discovery-sessions` - Start discovery session
- `GET /api/career-id/discovery-sessions/:sessionId` - Get session state
- `PATCH /api/career-id/discovery-sessions/:sessionId` - Update session (add/remove moments)
- `POST /api/career-id/discovery-sessions/:sessionId/end` - End session (finalize moments)

**Rationale:** RESTful design:
- Follows project conventions
- Clear separation of concerns
- Easy to test and debug
- Extensible for future features

### 5. Frontend Architecture: Session-Based UI

**Decision:** Discovery session UI includes:
1. **Question Prompt** - Placeholder for AI coach (currently static)
2. **User Input Area** - Text input for achievement narrative
3. **Moment Confirmation** - Form to confirm/edit title and notes
4. **Running List** - Display of all moments captured in session
5. **Session Controls** - Continue, Edit, Remove, End Session buttons

**Rationale:** Session-based UI:
- Provides clear progress and momentum
- Allows review and refinement before session ends
- Reduces cognitive load with one question at a time
- Enables graceful error recovery

### 6. Moment Display: Management Page Integration

**Decision:** Moments are displayed on HERO management page in:
- **Discovered Moments Section** (above or alongside Your HERO Stories)
- **Count Badge** - "You have X discovered moments"
- **Moment Cards** - Title, first 2 sentences of raw notes, discovery timestamp
- **Status Badge** - "Discovered - Not Yet Developed"
- **Action Buttons** - "Develop into Story", "Remove"

**Rationale:** Clear visual distinction:
- Users understand moments are starting points
- Moments are easily accessible for development
- Conversion path is obvious
- Analytics tracking is straightforward

### 7. Session Persistence: Local Cache + Server

**Decision:** Discovery session state is:
- Cached locally in browser (IndexedDB or localStorage)
- Synced to server after each moment capture
- Restored on page refresh from server
- Finalized when user clicks "End Session"

**Rationale:** Hybrid approach:
- Survives page refreshes and brief disconnections
- Reduces server load for in-progress sessions
- Ensures data consistency
- Allows analytics tracking

### 8. Moment-to-Story Conversion: Tracking Link

**Decision:** When a moment is developed into a story:
- `converted_at` timestamp is set on the moment
- `converted_story_id` is set to the new story's ID
- Moment no longer appears in "Discovered Moments" section
- Moment data is available for story context

**Rationale:** Tracking conversion:
- Enables analytics on discovery and conversion rates
- Allows users to see which moments became stories
- Supports future features (e.g., "You converted 3 of 5 moments")
- Maintains audit trail

## Risks & Trade-offs

| Risk | Mitigation |
|------|-----------|
| Users abandon moments without developing them | Provide clear "Develop into Story" path; show conversion count; encourage regular review |
| Session state is lost on browser crash | Sync to server after each moment; restore from server on refresh |
| Moments become stale or outdated | Encourage users to review moments when updating profile; allow editing anytime |
| Users create low-quality moments | Provide clear guidance in UI; show examples; allow editing before session ends |
| Discovery sessions accumulate in database | Implement cleanup for old sessions; allow users to delete sessions |

## Migration Plan

**Phase 1: Database & Backend**
- Create `hero_moments` and `discovery_sessions` tables
- Implement moments CRUD endpoints
- Implement discovery session endpoints
- Add error handling and logging

**Phase 2: Frontend - Mock UI**
- Create discovery session page with mock data
- Create moments management section on HERO page
- Create moment cards and forms
- Use mock data for testing

**Phase 3: Frontend - Integration**
- Connect discovery session page to backend
- Connect moments management to backend
- Implement session state persistence
- Add loading states and error handling

**Phase 4: Polish & Testing**
- Add validation and error messages
- Implement confirmation dialogs
- Add success confirmations
- Performance optimization
