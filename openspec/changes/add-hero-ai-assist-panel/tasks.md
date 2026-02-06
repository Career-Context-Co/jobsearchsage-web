# Implementation Tasks

## Phase 1: Database - Hero Story Sessions Table

### DB-001: Alter Hero Story Sessions Table
- [x] Create migration file `022_alter_hero_story_sessions.sql`
- [x] Add column: `section_type TEXT NOT NULL DEFAULT 'hurdle'`
- [x] Add column: `session_status TEXT NOT NULL DEFAULT 'active'`
- [x] Add column: `moment_id TEXT NULL`
- [x] Update table and column comments to reflect new purpose
- [x] Document session_data JSONB structure in `SESSION_DATA_STRUCTURE.md`
- [x] Test migration runs successfully on existing table

**Dependencies:** None (table already exists from prior migration)
**Success criteria:** Three new columns added, migration is idempotent and safe

## Phase 2: Backend - AI Enhancement API

### BE-001: Section Enhancement Conversation API Endpoints
- [x] Create `server/api/ai/hero-session/start.post.ts`
- [x] Accept start request: `{ profile_id, story_id, section_type, moment_title, moment_description?, moment_id?, current_values: {field1, field2, field3}, source_experience? }`
- [x] Validate section_type is one of: hurdle, expectation, response, outcome
- [x] Create session record in hero_story_sessions table with status 'active'
- [x] Store session_id (from DB) for tracking
- [x] Call hero-story-enhancer utility with conversation start
- [x] Store first AI message in session_data.conversation_history
- [x] Return: `{ success: true, ai_message: string, session_id: number, is_complete: false }`
- [x] Create `server/api/ai/hero-session/continue.post.ts`
- [x] Accept continue request: `{ session_id, user_message }`
- [x] Retrieve conversation state from hero_story_sessions table
- [x] Append user message to session_data.conversation_history
- [x] Call hero-story-enhancer utility with conversation continue
- [x] Append AI response to session_data.conversation_history
- [x] If conversation complete, store final_output in session_data and set session_status = 'completed', ended_at = NOW()
- [x] Return: `{ success: true, ai_message: string, is_complete: boolean, final_output?: {field1, field2, field3} }`
- [x] Add error handling for timeout, API errors, invalid responses
- [x] Add request logging for debugging

**Dependencies:** DB-001 (table must exist)
**Success criteria:** Endpoints support multi-turn conversations for all 4 section types and persist to database

### BE-002: AI Enhancement Conversation Utility
- [x] Create `server/utils/hero-story-enhancer.ts`
- [x] Implement `startEnhancementConversation(sectionType, momentContext, currentValues, experience?)` function
- [x] Implement `continueEnhancementConversation(conversationHistory, sectionType, userMessage)` function
- [x] Create section-specific interactive coaching prompts for all 4 sections:
  - Hurdle prompt (asks targeted questions for PROBLEM, SCOPE, STAKES)
  - Expectation prompt (asks targeted questions for ROLE, GOALS, CONSTRAINTS)
  - Response prompt (asks targeted questions for ACTIONS, TOOLS, CHALLENGES)
  - Outcome prompt (asks targeted questions for DELIVERABLE, METRICS, IMPACT)
- [x] Use Vercel AI SDK with AI Gateway (following pattern from hero-discovery-service.ts)
- [x] Pass full conversation history to AI on each turn
- [x] Detect conversation completion (parse for JSON output with conversation_complete: true)
- [x] Extract final structured output when conversation completes
- [x] Add timeout handling (30s max per turn)
- [x] Export custom error class `HeroEnhancementError` with error codes

**Dependencies:** None
**Success criteria:** Utility conducts multi-turn conversations for any section type, state is managed in database by API layer

### BE-003: Postman Collection for API Testing
- [x] Create `openspec/changes/add-hero-ai-assist-panel/deliverables/HERO_Section_Enhancement.postman_collection.json`
- [x] Add happy path tests for all 4 section types:
  - POST /start with valid context and current_values (returns session_id)
  - POST /continue with session_id and user message
  - Multiple continue rounds until is_complete: true
  - Verify final_output structure matches section type
  - Verify session record in database has status 'completed' and ended_at set
- [x] Add error tests:
  - Missing section_type on start
  - Invalid section_type on start
  - Invalid session_id on continue
  - Missing user_message on continue
- [x] Add conversation flow tests:
  - Start → Continue → Continue → Complete flow
  - Start multiple sections simultaneously (different session_ids)
  - Abandon session (start but never complete)
- [x] Add database verification tests:
  - Verify session created with correct section_type
  - Verify conversation_history updates after each continue
  - Verify final_output stored when complete
- [x] Add success assertions (200 status, response structure validation)
- [x] Use Postman variables to store session_id between requests
- [x] Document setup instructions in `deliverables/POSTMAN_SETUP.md`

**Dependencies:** BE-001, BE-002, DB-001
**Success criteria:** All Postman tests pass, collection validates full conversation flow and database persistence

## Phase 3: Frontend - AI Assistance UI

### FE-001: Hero Story AI Container Panel
- [x] Create `app/components/profile/hero/SessionPane.vue` (main container, like `@app/components/profile/EnhancementPane.vue`)
- [x] Implement as a slide-in right-side panel using Nuxt UI Slideover (similar to `@app/pages/profile/experience.vue` enhancement drawer)
- [x] Design structure matching `EnhancementPane.vue`:
  - Header with section title, progress indicator (showing step 1-4), and close button (i-lucide-x)
  - Main scrollable content area for rendering current step pane
  - Footer with Back/Next/Accept/Dismiss buttons
- [x] Add props: `storyId`, `initialSectionType` (hurdle|expectation|response|outcome)
- [x] Add state: `currentStep` ref (1-4, corresponding to Hurdle/Expectation/Response/Outcome)
- [x] Add computed step labels: 
  - Step 1: "Hurdle - The Challenge"
  - Step 2: "Expectation - Your Role & Goals"
  - Step 3: "Response - Your Actions"
  - Step 4: "Outcome - The Results"
- [x] Add progress bar showing current step out of 4
- [x] Conditionally render sub-pane components based on currentStep:
  - Step 1: `SessionPaneHurdleStep`
  - Step 2: `SessionPaneExpectationStep` (to be implemented)
  - Step 3: `SessionPaneResponseStep` (to be implemented)
  - Step 4: `SessionPaneOutcomeStep` (to be implemented)
- [x] Implement Next button: advance currentStep (generate AI suggestions at end of each step)
- [x] Implement Back button: go back to previous step
- [x] Implement Accept button (visible only on last step): emit accept event with all collected suggestions
- [x] Implement Dismiss button: emit close event without accepting
- [x] Manage overall state for all 4 steps' answers and suggestions
- [x] Handle step transitions with loading state during AI suggestion generation
- [x] Validate each step has at least one answer before proceeding

**Dependencies:** None (partially implemented, Steps 2-4 panes needed)
**Success criteria:** SessionPane container manages 4-step flow with navigation, correctly conditionally renders step panes

### FE-002: Hurdle AI Pane (Step 1)
- [x] Create `app/components/profile/hero/SessionPaneHurdleStep.vue` (step 1 of 4)
- [x] Reference component for implementing remaining steps - mirrors `@app/components/profile/EnhancementQuestionRound.vue` pattern
- [x] Display: "Hurdle - The Challenge" section with info banner
- [x] Implement grouped question structure with 3 groups:
  - **Group 1 - Problem**: Question "Tell us about the problem you faced"
  - **Group 2 - Scope**: Question "Define the scope and size of the problem"
  - **Group 3 - Stakes**: Question "What were the stakes? Why did it matter?"
- [x] For each group:
  - Collapsible group header with group name, title, question count
  - Display single question with textarea input
  - Show status badge: Answered/Skipped/Unanswered
  - Add Skip button and Save button below textarea
- [x] Store answers in real-time as user types
- [x] Track skipped questions
- [x] Validation: at least one question must be answered to proceed
- [x] Display AI suggestions in read-only format after generation
- [x] Show loading spinner during AI generation
- [x] Props: `answers`, `suggestions`, `isLoading`
- [x] Emits: `update:answers`, `submit`
- [x] Integrate into `SessionPane.vue` (line 197-206)

**Dependencies:** None (already implemented)
**Success criteria:** SessionPaneHurdleStep component complete and serves as reference template for remaining 3 steps

### FE-003: Expectation AI Pane (Step 2)
- [x] Create `app/components/profile/hero/SessionPaneExpectationStep.vue` (step 2 of 4, mirrors `SessionPaneHurdleStep.vue` pattern)
- [x] Display info banner explaining the Expectation step with descriptive text (like line 117-125 of HurdleStep)
- [x] Implement grouped question structure with 3 question groups (matching HurdleStep structure):
  - **Group 1 - Role**: 
    - Label: "Role"
    - Title: "Your Position"
    - Question: "Describe your role and responsibilities"
    - Placeholder: "What was your specific role? What were your key responsibilities in this situation?"
  - **Group 2 - Goals**: 
    - Label: "Goals"
    - Title: "What You Were Trying to Achieve"
    - Question: "What were your goals in this situation?"
    - Placeholder: "What did you want to accomplish? What success looked like to you?"
  - **Group 3 - Constraints**: 
    - Label: "Constraints"
    - Title: "Limitations & Boundaries"
    - Question: "What constraints or limitations did you face?"
    - Placeholder: "What were the boundaries or limitations? Budget, time, resources, or organizational constraints?"
- [x] Props: `answers?: Record<string, string>`, `suggestions?: Record<string, string>`, `isLoading?: boolean`
- [x] Emit events: `update:answers` with updated answers, `submit` when user clicks "Submit Answers"
- [x] Collapsible question groups (toggle expand/collapse with chevron icon)
- [x] Each group contains:
  - Group header with label, title, and status badge (Answered/Skipped/Unanswered)
  - Expanded content with question text, textarea input, skip/save buttons (see `SessionPaneHurdleStep.vue` line 156-237)
  - Textarea with autoresize, real-time answer tracking
  - Skip button (removes answer, marks skipped)
  - Save button (collapses group)
- [x] Store answers locally in component with real-time emit to parent
- [x] Track skipped questions
- [x] All groups expanded by default on mount
- [x] "AI Suggestions Generated" read-only section after generation (matching `SessionPaneHurdleStep.vue` line 128-145)
- [x] Loading spinner during suggestion generation (matching `SessionPaneHurdleStep.vue` line 110-115)
- [x] Display info banner unique to Expectation step (explain the importance of defining role and goals clearly)
- [x] "Submit Answers" button at bottom (disabled until at least one question answered)
- [x] Integrate into `SessionPane.vue` as conditional render (like line 209-213)

**Dependencies:** FE-001
**Success criteria:** Step 2 displays Role/Goals/Constraints groups, matches `SessionPaneHurdleStep.vue` UX pattern exactly, properly emits answers and submit events

### FE-004: Response AI Pane (Step 3)
- [x] Create `app/components/profile/hero/SessionPaneResponseStep.vue` (step 3 of 4, mirrors `SessionPaneHurdleStep.vue` pattern)
- [x] Display info banner explaining the Response step with descriptive text
- [x] Implement grouped question structure with 3 question groups:
  - **Group 1 - Actions**: 
    - Label: "Actions"
    - Title: "What You Did"
    - Question: "What specific actions did you take?"
    - Placeholder: "Walk us through the steps you took. What was your approach? Be specific about what you did."
  - **Group 2 - Tools**: 
    - Label: "Tools & Resources"
    - Title: "How You Solved It"
    - Question: "What tools, technologies, or resources did you use?"
    - Placeholder: "What tools, technologies, methodologies, or resources did you leverage? Why were they the right choice?"
  - **Group 3 - Challenges**: 
    - Label: "Challenges"
    - Title: "Obstacles Encountered"
    - Question: "What challenges did you face while executing?"
    - Placeholder: "What obstacles or setbacks did you encounter? How did you overcome them?"
- [x] Props: `answers?: Record<string, string>`, `suggestions?: Record<string, string>`, `isLoading?: boolean`
- [x] Emit events: `update:answers` with updated answers, `submit` when user clicks "Submit Answers"
- [x] Collapsible question groups with status badges (Answered/Skipped/Unanswered)
- [x] Each group: header with label/title, expandable content with textarea, skip/save buttons
- [x] Store answers locally with real-time emit to parent
- [x] Track skipped questions
- [x] All groups expanded by default on mount
- [x] "AI Suggestions Generated" read-only section after generation
- [x] Loading spinner during suggestion generation
- [x] Display info banner unique to Response step (explain the importance of detailing actions and approach)
- [x] "Submit Answers" button at bottom (disabled until at least one question answered)
- [x] Integrate into `SessionPane.vue` as conditional render

**Dependencies:** FE-001
**Success criteria:** Step 3 displays Actions/Tools/Challenges groups, matches `SessionPaneHurdleStep.vue` pattern, properly emits answers and submit events

### FE-005: Outcome AI Pane (Step 4)
- [x] Create `app/components/profile/hero/SessionPaneOutcomeStep.vue` (step 4 of 4, mirrors `SessionPaneHurdleStep.vue` pattern)
- [x] Display info banner explaining the Outcome step with descriptive text
- [x] Implement grouped question structure with 3 question groups:
  - **Group 1 - Deliverable**: 
    - Label: "Deliverable"
    - Title: "What You Delivered"
    - Question: "What was the final deliverable or outcome?"
    - Placeholder: "What was produced or completed? What was the tangible result? Feature launched, goal achieved, etc?"
  - **Group 2 - Metrics**: 
    - Label: "Metrics"
    - Title: "How Success Was Measured"
    - Question: "How did you measure success? What were the metrics?"
    - Placeholder: "What metrics, KPIs, or measures of success did you track? Numbers, percentages, qualitative improvements?"
  - **Group 3 - Impact**: 
    - Label: "Impact"
    - Title: "Why It Matters"
    - Question: "What was the impact? How did this matter?"
    - Placeholder: "What was the business impact? How did this affect users, the team, or the company? Why was this meaningful?"
- [x] Props: `answers?: Record<string, string>`, `suggestions?: Record<string, string>`, `isLoading?: boolean`
- [x] Emit events: `update:answers` with updated answers, `submit` when user clicks "Submit Answers"
- [x] Collapsible question groups with status badges (Answered/Skipped/Unanswered)
- [x] Each group: header with label/title, expandable content with textarea, skip/save buttons
- [x] Store answers locally with real-time emit to parent
- [x] Track skipped questions
- [x] All groups expanded by default on mount
- [x] "AI Suggestions Generated" read-only section after generation
- [x] Loading spinner during suggestion generation
- [x] Display info banner unique to Outcome step (explain importance of quantifying results and impact)
- [x] "Submit Answers" button at bottom (disabled until at least one question answered)
- [x] This is the final step before accepting all 4 sections' suggestions
- [x] Integrate into `SessionPane.vue` as conditional render

**Dependencies:** FE-001
**Success criteria:** Step 4 displays Deliverable/Metrics/Impact groups, matches `SessionPaneHurdleStep.vue` pattern, properly emits answers and submit events, final step before completion

### FE-006: Hero Moments AI Enhancement Button
- [x] Modify hero story form component (e.g., `HeroStoryCard.vue` or hero form parent)
- [x] Add "Get AI Help" button to form header or beginning of form
- [x] Pattern: Similar to `@app/pages/profile/experience.vue` line 689-695 (sparkles icon button)
- [x] Button label: "Get AI Help" or icon-only sparkles button
- [x] Implement button disabled state: disable if form is empty (no section has any data) - enabled when editing existing stories
- [x] Wire button click to open HeroStoryAIPanel with initialSectionType="hurdle" (always start with Step 1)
- [x] Show sparkles icon with color="primary" variant="ghost" size="sm"
- [x] Wire "Develop into HERO Story" button on MomentCard to open AI panel
- [ ] Add visual indicator when enhancement has been applied (badge like in experience.vue line 676-683)

**Dependencies:** FE-001 through FE-005
**Success criteria:** Single "Get AI Help" button appears, proper disabled state, opens container panel at Step 1

### FE-007: Store Methods for Hero Enhancement Sessions
- [x] **NOTE:** All API calls must go through stores (project convention)
- [x] Modify `app/stores/sageAIStore.ts` to add hero enhancement session lifecycle methods (follows pattern of existing `startDiscoverySession`, `continueDiscoverySession`, `endDiscoverySession`)
- [x] Add state: `heroEnhancementSession: { id: number | null, profile_id: string | null, story_id: string | null, section_type: string | null } | null`
- [x] Add action: `startHeroEnhancementSession(profileId: string, storyId: string, sectionType: string, currentValues: Record<string, string>, momentTitle?: string, momentDescription?: string)`
  - Calls `POST /api/ai/hero-session/start`
  - Pass: `profile_id`, `story_id`, `section_type`, `current_values`, optional `moment_title`, `moment_description`
  - Returns: `{ session_id, ai_message, suggestions }`
  - Store session data in `heroEnhancementSession` state
  - Handle errors and throw with descriptive messages
  - Set `isLoading = true` during call
- [x] Add action: `continueHeroEnhancementSession(sessionId: number, userMessage: string)`
  - Calls `POST /api/ai/hero-session/continue`
  - Pass: `session_id`, `user_message`
  - Returns: `{ ai_message, is_complete, final_output? }`
  - Handle errors and throw with descriptive messages
  - Set `isLoading = true` during call
- [x] Add action: `endHeroEnhancementSession(sessionId: number, status?: 'completed' | 'abandoned')`
  - Calls `POST /api/ai/hero-session/end` (if endpoint exists)
  - Clears `heroEnhancementSession` state
  - Marks session as completed or abandoned
- [x] **Note:** CRUD operations on hero stories (saving AI-generated content) already exist in `careerIDStore.ts` (`updateStory()`, `createStory()`)

**Dependencies:** BE-001 (API must exist)
**Success criteria:** sageAIStore provides hero enhancement session lifecycle methods following discovery session pattern, careerIDStore already handles story CRUD

### FE-008: Wire SessionPane to Store Methods
- [x] SessionPane component already exists and manages all internal state (`@app/components/profile/hero/SessionPane.vue`)
- [x] hero.vue already has slideover integration with SessionPane (`@app/pages/profile/hero.vue`)
- [x] "Get AI Help" button already exists in hero.vue (line 465-473)
- [x] SessionPane already emits `@accept` event with suggestions
- [x] hero.vue already handles accept event with `handleAcceptAISuggestions()` (line 360-391)
- [x] **Wire SessionPane to sageAIStore:**
  - HeroStorySession.vue uses sageAIStore methods (startHeroEnhancementSession, continueHeroEnhancementSession)
  - Session state managed via sessionId ref and API calls
  - Suggestions stored in hurdleFieldSessions and passed via accept-suggestions event
  - Panel close handled by parent via close event
  - Accept triggers emit to parent which stores/applies suggestions
- [x] **Wire hero.vue state to HeroStoryCard for edit mode:**
  - Added `pendingStoryAISuggestions` state in hero.vue
  - Updated `handleAcceptAISuggestions` to handle both create (formDataForCreate) and edit mode (pendingStoryAISuggestions)
  - Pass pendingSuggestions through HeroStoriesSection to HeroStoryCard
  - HeroStoryCard watches for pendingSuggestions and applies to form, then emits suggestionsApplied
- [ ] **Test the full flow:**
  - Click "Get AI Help" button → SessionPane opens
  - Answer questions in Step 1 (Hurdle) → Submit → verify real API call to `/api/ai/hero-session/start`
  - Navigate through Steps 2-4 → verify API calls to `/api/ai/hero-session/continue`
  - Accept suggestions → verify form fields populated correctly
  - Verify suggestions saved to hero story via `careerIDStore.updateStory()` or `createStory()`
  - Verify toast notifications display

**Dependencies:** FE-001 through FE-007 (all must be complete), BE-001 (API exists)
**Success criteria:** SessionPane calls sageAIStore methods (no direct API calls), full 4-step flow works with real API integration, hero story CRUD uses careerIDStore

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
