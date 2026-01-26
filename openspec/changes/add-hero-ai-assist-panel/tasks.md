# Implementation Tasks

## Phase 1: Database - Hero Story Sessions Table

### DB-001: Alter Hero Story Sessions Table
- [ ] Create migration file `022_alter_hero_story_sessions.sql`
- [ ] Add column: `section_type TEXT NOT NULL DEFAULT 'hurdle'`
- [ ] Add column: `session_status TEXT NOT NULL DEFAULT 'active'`
- [ ] Add column: `moment_id TEXT NULL`
- [ ] Update table and column comments to reflect new purpose
- [ ] Document session_data JSONB structure in `SESSION_DATA_STRUCTURE.md`
- [ ] Test migration runs successfully on existing table

**Dependencies:** None (table already exists from prior migration)
**Success criteria:** Three new columns added, migration is idempotent and safe

## Phase 2: Backend - AI Enhancement API

### BE-001: Section Enhancement Conversation API Endpoints
- [ ] Create `server/api/ai/hero-story/enhance-section/start.post.ts`
- [ ] Accept start request: `{ profile_id, story_id, section_type, moment_title, moment_description?, moment_id?, current_values: {field1, field2, field3}, source_experience? }`
- [ ] Validate section_type is one of: hurdle, expectation, response, outcome
- [ ] Create session record in hero_story_sessions table with status 'active'
- [ ] Store session_id (from DB) for tracking
- [ ] Call hero-story-enhancer utility with conversation start
- [ ] Store first AI message in session_data.conversation_history
- [ ] Return: `{ success: true, ai_message: string, session_id: number, is_complete: false }`
- [ ] Create `server/api/ai/hero-story/enhance-section/continue.post.ts`
- [ ] Accept continue request: `{ session_id, user_message }`
- [ ] Retrieve conversation state from hero_story_sessions table
- [ ] Append user message to session_data.conversation_history
- [ ] Call hero-story-enhancer utility with conversation continue
- [ ] Append AI response to session_data.conversation_history
- [ ] If conversation complete, store final_output in session_data and set session_status = 'completed', ended_at = NOW()
- [ ] Return: `{ success: true, ai_message: string, is_complete: boolean, final_output?: {field1, field2, field3} }`
- [ ] Add error handling for timeout, API errors, invalid responses
- [ ] Add request logging for debugging

**Dependencies:** DB-001 (table must exist)
**Success criteria:** Endpoints support multi-turn conversations for all 4 section types and persist to database

### BE-002: AI Enhancement Conversation Utility
- [ ] Create `server/utils/hero-story-enhancer.ts`
- [ ] Implement `startEnhancementConversation(sectionType, momentContext, currentValues, experience?)` function
- [ ] Implement `continueEnhancementConversation(conversationHistory, sectionType, userMessage)` function
- [ ] Create section-specific interactive coaching prompts for all 4 sections:
  - Hurdle prompt (asks targeted questions for PROBLEM, SCOPE, STAKES)
  - Expectation prompt (asks targeted questions for ROLE, GOALS, CONSTRAINTS)
  - Response prompt (asks targeted questions for ACTIONS, TOOLS, CHALLENGES)
  - Outcome prompt (asks targeted questions for DELIVERABLE, METRICS, IMPACT)
- [ ] Use Vercel AI SDK with AI Gateway (following pattern from hero-discovery-service.ts)
- [ ] Pass full conversation history to AI on each turn
- [ ] Detect conversation completion (parse for JSON output with conversation_complete: true)
- [ ] Extract final structured output when conversation completes
- [ ] Add timeout handling (30s max per turn)
- [ ] Export custom error class `HeroEnhancementError` with error codes

**Dependencies:** None
**Success criteria:** Utility conducts multi-turn conversations for any section type, state is managed in database by API layer

### BE-003: Postman Collection for API Testing
- [ ] Create `openspec/changes/add-hero-ai-assist-panel/deliverables/HERO_Section_Enhancement.postman_collection.json`
- [ ] Add happy path tests for all 4 section types:
  - POST /start with valid context and current_values (returns session_id)
  - POST /continue with session_id and user message
  - Multiple continue rounds until is_complete: true
  - Verify final_output structure matches section type
  - Verify session record in database has status 'completed' and ended_at set
- [ ] Add error tests:
  - Missing section_type on start
  - Invalid section_type on start
  - Invalid session_id on continue
  - Missing user_message on continue
- [ ] Add conversation flow tests:
  - Start → Continue → Continue → Complete flow
  - Start multiple sections simultaneously (different session_ids)
  - Abandon session (start but never complete)
- [ ] Add database verification tests:
  - Verify session created with correct section_type
  - Verify conversation_history updates after each continue
  - Verify final_output stored when complete
- [ ] Add success assertions (200 status, response structure validation)
- [ ] Use Postman variables to store session_id between requests
- [ ] Document setup instructions in `deliverables/POSTMAN_SETUP.md`

**Dependencies:** BE-001, BE-002, DB-001
**Success criteria:** All Postman tests pass, collection validates full conversation flow and database persistence

## Phase 3: Frontend - AI Assistance UI

### FE-001: AI Conversation Panel Component
- [ ] Create `app/components/profile/hero/AIConversationPanel.vue`
- [ ] Implement slide-in side panel (right edge overlay)
- [ ] Add props: `isOpen`, `sectionType`, `momentTitle`, `momentDescription`, `currentFieldValues`, `sourceExperience`
- [ ] Display section title as panel header
- [ ] Display conversation history (scrollable message thread)
- [ ] Visually distinguish AI messages from user messages
- [ ] Add text input field for user responses
- [ ] Add "Send" button to submit user message
- [ ] Add "Accept" button (disabled until conversation complete, emits accept event)
- [ ] Add "Regenerate" button (emits regenerate event to start fresh)
- [ ] Add "Dismiss/Close" button (emits close event)
- [ ] Show loading state during AI processing (after send)
- [ ] Auto-scroll to latest message
- [ ] Display error messages with retry button
- [ ] Style with Nuxt UI components (UCard, UButton, UInput, UScrollArea)

**Dependencies:** None (can build with mock data)
**Success criteria:** Panel displays conversation flow, all buttons emit correct events, UI supports chat-like interaction

### FE-002: Get AI Help Buttons in Form
- [ ] Modify `app/components/profile/hero/HeroStoryCard.vue`
- [ ] Add "Get AI Help" button to Hurdle section header
- [ ] Add "Get AI Help" button to Expectation section header
- [ ] Add "Get AI Help" button to Response section header
- [ ] Add "Get AI Help" button to Outcome section header
- [ ] Implement button disabled state (all 3 section fields empty)
- [ ] Wire button click to open AI panel with section type and current values
- [ ] Pass section-specific answers to panel (e.g., hurdleProblem, hurdleScope, hurdleStakes)

**Dependencies:** None (buttons can be added before panel integration)
**Success criteria:** Buttons appear in all 4 sections, disabled logic works correctly

### FE-003: Store Actions for AI Conversation
- [ ] Modify `app/stores/careerIDStore.ts`
- [ ] Add state: `aiConversation` with fields:
  - `session_id: number | null`
  - `section_type: string | null`
  - `conversation_history: Array<{role: 'assistant' | 'user', content: string}>`
  - `is_active: boolean`
  - `is_complete: boolean`
  - `final_output: Record<string, string> | null`
- [ ] Add state: `isEnhancing: boolean`
- [ ] Add state: `enhancementError: string | null`
- [ ] Add action: `startEnhancement(profileId, storyId, sectionType, momentTitle, momentDescription, momentId, currentValues, sourceExperience?)`
- [ ] Call `POST /api/ai/hero-story/enhance-section/start` and store session_id
- [ ] Add action: `continueEnhancement(userMessage)`
- [ ] Call `POST /api/ai/hero-story/enhance-section/continue` with session_id
- [ ] Update conversation_history with each message
- [ ] Set is_complete when API returns is_complete: true
- [ ] Store final_output when conversation completes
- [ ] Add action: `regenerateEnhancement()` to restart conversation (new session)
- [ ] Add action: `dismissEnhancement()` to clear conversation state (marks session as 'abandoned' in DB)
- [ ] Update state on errors with error message

**Dependencies:** BE-001 (API must exist)
**Success criteria:** Store manages full conversation lifecycle with proper state transitions and session tracking

### FE-004: Integrate Conversation Panel with Form
- [ ] Wire "Get AI Help" button clicks to call `startEnhancement()` action
- [ ] Pass moment title, description, current field values, and source experience to action
- [ ] Show AIConversationPanel when `aiConversation.is_active` is true
- [ ] Display conversation history from store in panel
- [ ] Handle user message send: call `continueEnhancement(userMessage)` action
- [ ] Handle "Accept" event: populate form fields with `final_output`, call `dismissEnhancement()`
- [ ] Handle "Regenerate" event: call `regenerateEnhancement()` with updated field values
- [ ] Handle "Dismiss" event: call `dismissEnhancement()` without changing form
- [ ] Map section type to correct form fields for accept:
  - hurdle → hurdleProblem, hurdleScope, hurdleStakes
  - expectation → expectationRole, expectationGoals, expectationConstraints
  - response → responseActions, responseTools, responseChallenges
  - outcome → outcomeDeliverable, outcomeMetrics, outcomeImpact
- [ ] Extract source experience from form state (if story has sourceExperienceId)

**Dependencies:** FE-001, FE-002, FE-003
**Success criteria:** Complete conversation flow works: click help → chat with AI → accept → form updates

## Phase 4: Documentation & Deliverables

### DOC-001: AI Prompt Documentation
- [ ] Create `openspec/changes/add-hero-ai-assist-panel/deliverables/prompts/hero-section-enhancement-prompt.md`
- [ ] Document all 4 section-specific prompts with examples
- [ ] Include prompt engineering rationale and guidelines
- [ ] Add example input/output pairs for each section
- [ ] Document how to modify prompts if AI quality needs adjustment

**Dependencies:** BE-002 (prompts must be written in utility)
**Success criteria:** Documentation clearly explains all prompts and their purpose

## Phase 5: Testing & Validation

### TEST-001: End-to-End Flow Testing
- [ ] Test complete flow: click "Get AI Help" → view suggestions → accept → verify form
- [ ] Test regeneration: click help → edit suggestions → regenerate → verify new suggestions
- [ ] Test dismiss: click help → dismiss → verify form unchanged
- [ ] Test all 4 sections independently
- [ ] Test with empty form (button disabled)
- [ ] Test with partially filled section (button enabled)
- [ ] Test with fully filled section (button enabled)
- [ ] Verify source_experience_id passed correctly when available

**Dependencies:** FE-004
**Success criteria:** All user flows work as expected with no errors

### TEST-002: Error Handling Testing
- [ ] Test network timeout (simulate with network throttling)
- [ ] Test API error response (modify endpoint to return error)
- [ ] Test invalid AI response (modify utility to return malformed data)
- [ ] Verify error messages display correctly
- [ ] Verify retry button works
- [ ] Verify form content preserved on all errors

**Dependencies:** FE-004
**Success criteria:** All error scenarios handled gracefully with clear messages

### TEST-003: Acceptance Criteria Validation
- [ ] AC 4.0: Verify "Get AI Help" button exists on all 4 sections
- [ ] AC 4.0: Verify button disabled until at least one answer entered
- [ ] AC 3.1: Verify all section answers sent in one API call
- [ ] AC 4.1: Verify suggestions display without replacing form
- [ ] AC 4.1: Verify accept button populates form fields
- [ ] AC 4.2: Verify user can edit suggestions inline
- [ ] AC 4.3: Verify regenerate sends edited content for new suggestions
- [ ] AC 4.4: Verify dismiss keeps form unchanged
- [ ] AC 8.1: Verify error messages are user-friendly

**Dependencies:** TEST-001, TEST-002
**Success criteria:** All acceptance criteria from Linear issues met
