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
- [x] Create `app/components/profile/hero/HeroStoryAIPanel.vue` (main container, like `@app/components/profile/EnhancementPane.vue`)
- [x] Implement as a slide-in right-side panel using Nuxt UI Slideover (similar to `@app/pages/profile/experience.vue` enhancement drawer)
- [x] Design structure matching `EnhancementPane.vue`:
  - Header with section title, progress indicator (showing step 1-4), and close button (i-lucide-x)
  - Main scrollable content area for rendering current step pane
  - Footer with Back/Next/Accept/Dismiss buttons
- [x] Add props: `isOpen`, `storyId`, `initialSectionType` (hurdle|expectation|response|outcome)
- [x] Add state: `currentStep` ref (1-4, corresponding to Hurdle/Expectation/Response/Outcome)
- [x] Add computed step labels: 
  - Step 1: "Hurdle - The Challenge"
  - Step 2: "Expectation - Your Role & Goals"
  - Step 3: "Response - Your Actions"
  - Step 4: "Outcome - The Results"
- [x] Add progress bar showing current step out of 4 (like `EnhancementPane.vue` line 214-218)
- [x] Conditionally render sub-pane components based on currentStep:
  - Step 1: `HeroHurdleAIPane`
  - Step 2: `HeroExpectationAIPane`
  - Step 3: `HeroResponseAIPane`
  - Step 4: `HeroOutcomeAIPane`
- [x] Implement Next button: advance currentStep (generate AI suggestions at end of each step)
- [x] Implement Back button: go back to previous step
- [x] Implement Accept button (visible only on last step): emit accept event with all collected suggestions
- [x] Implement Dismiss button: emit close event without accepting
- [x] Manage overall state for all 4 steps' answers and suggestions
- [x] Handle step transitions with loading state during AI suggestion generation

**Dependencies:** None
**Success criteria:** Container manages 4-step flow with navigation, conditionally renders sub-panes, buttons work correctly

### FE-002: Hurdle AI Pane (Step 1)
- [x] Create `app/components/profile/hero/HeroHurdleAIPane.vue` (step 1 of 4)
- [x] Display: "Hurdle - The Challenge" as section header
- [x] Implement grouped question structure with 3 groups matching `@app/components/profile/EnhancementQuestionRound.vue`:
  - **Group 1 - Problem**: Question "Tell us about the problem you faced"
  - **Group 2 - Scope**: Question "Define the scope and size of the problem"
  - **Group 3 - Stakes**: Question "What were the stakes? Why did it matter?"
- [x] For each group:
  - Show collapsible group header with group name and question count
  - Display single question with textarea input (like EnhancementQuestionRound line 278-284)
  - Show status badge: Answered/Skipped/Unanswered
  - Add Skip button and Save button below textarea
- [x] Store answers in real-time as user types
- [x] Track skipped questions
- [x] Validation: at least one question must be answered to proceed (handled by parent)
- [x] On "Next" click in parent, generate AI suggestions for hurdle using all 3 answers via `POST /api/ai/hero-session/continue` (parent handles API)
- [x] Display AI suggestions in read-only format after generation
- [x] Show loading spinner during AI generation (line 145-150 pattern from EnhancementQuestionRound)

**Dependencies:** FE-001
**Success criteria:** Step 1 displays Problem/Scope/Stakes groups with questions, collapsible groups, status badges, real-time answer storage

### FE-003: Expectation AI Pane (Step 2)
- [ ] Create `app/components/profile/hero/HeroExpectationAIPane.vue` (step 2 of 4)
- [ ] Display: "Expectation - Your Role & Goals" as section header
- [ ] Implement grouped question structure with 3 groups:
  - **Group 1 - Role**: Question "Describe your role and responsibilities"
  - **Group 2 - Goals**: Question "What were your goals in this situation?"
  - **Group 3 - Constraints**: Question "What constraints or limitations did you face?"
- [ ] Match HeroHurdleAIPane structure: collapsible groups, textareas, status badges, skip/save buttons
- [ ] Store answers in real-time
- [ ] Track skipped questions
- [ ] Validation: at least one question must be answered to proceed
- [ ] On "Next" click in parent, generate AI suggestions using all 3 answers
- [ ] Display AI suggestions in read-only format after generation
- [ ] Show loading spinner during AI generation

**Dependencies:** FE-001
**Success criteria:** Step 2 displays Role/Goals/Constraints groups with questions, matches Step 1 UX pattern

### FE-004: Response AI Pane (Step 3)
- [ ] Create `app/components/profile/hero/HeroResponseAIPane.vue` (step 3 of 4)
- [ ] Display: "Response - Your Actions" as section header
- [ ] Implement grouped question structure with 3 groups:
  - **Group 1 - Actions**: Question "What specific actions did you take?"
  - **Group 2 - Tools**: Question "What tools, technologies, or resources did you use?"
  - **Group 3 - Challenges**: Question "What challenges did you face while executing?"
- [ ] Match HeroHurdleAIPane structure: collapsible groups, textareas, status badges, skip/save buttons
- [ ] Store answers in real-time
- [ ] Track skipped questions
- [ ] Validation: at least one question must be answered to proceed
- [ ] On "Next" click in parent, generate AI suggestions using all 3 answers
- [ ] Display AI suggestions in read-only format after generation
- [ ] Show loading spinner during AI generation

**Dependencies:** FE-001
**Success criteria:** Step 3 displays Actions/Tools/Challenges groups with questions, matches Step 1-2 UX pattern

### FE-005: Outcome AI Pane (Step 4)
- [ ] Create `app/components/profile/hero/HeroOutcomeAIPane.vue` (step 4 of 4)
- [ ] Display: "Outcome - The Results" as section header
- [ ] Implement grouped question structure with 3 groups:
  - **Group 1 - Deliverable**: Question "What was the final deliverable or outcome?"
  - **Group 2 - Metrics**: Question "How did you measure success? What were the metrics?"
  - **Group 3 - Impact**: Question "What was the impact? How did this matter?"
- [ ] Match HeroHurdleAIPane structure: collapsible groups, textareas, status badges, skip/save buttons
- [ ] Store answers in real-time
- [ ] Track skipped questions
- [ ] Validation: at least one question must be answered to proceed
- [ ] On "Accept" click in parent, generate final AI suggestions using all 3 answers
- [ ] Display AI suggestions in read-only format after generation
- [ ] Show loading spinner during AI generation
- [ ] This is the final step before accepting suggestions

**Dependencies:** FE-001
**Success criteria:** Step 4 displays Deliverable/Metrics/Impact groups with questions, triggers final AI generation on accept

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

### FE-007: Store Actions for Hero Story AI Enhancement
- [ ] Modify `app/stores/careerIDStore.ts` or create `app/stores/heroStoryAIStore.ts`
- [ ] Add state: `heroAIPanel` with fields:
  - `isOpen: boolean`
  - `currentStoryId: number | null`
  - `allStepAnswers: Record<string, Record<string, string>>` (stores answers for all 4 steps: { hurdle: {...}, expectation: {...}, response: {...}, outcome: {...} })
  - `allStepSuggestions: Record<string, Record<string, string>> | null` (AI suggestions for all 4 steps)
  - `currentSessionId: number | null`
  - `isGeneratingSuggestions: boolean`
  - `error: string | null`
- [ ] Add action: `openHeroAIPanel(storyId: number)`
  - Sets panel state to open
  - Initializes currentStoryId
  - Clears previous answers/suggestions
- [ ] Add action: `startHeroAIEnhancement(storyId, stepAnswers)` (called at end of each step)
  - Calls `POST /api/ai/hero-session/start` with section_type (hurdle/expectation/response/outcome) and current_values (answers for that step)
  - Stores session_id
  - Returns initial AI message/suggestions
- [ ] Add action: `continueHeroAIEnhancement(stepType, userAnswers)` (called when moving to next step)
  - Calls `POST /api/ai/hero-session/continue` with accumulated user answers
  - Stores returned suggestions for that step
  - Returns is_complete flag
- [ ] Add action: `acceptHeroAISuggestions()`
  - Returns all suggestions from allStepSuggestions
  - Marks all sections as enhanced
  - Closes panel
- [ ] Add action: `dismissHeroAIPanel()`
  - Marks session as abandoned if needed
  - Clears panel state without affecting form
  - Closes panel

**Dependencies:** BE-001 (API must exist)
**Success criteria:** Store manages multi-step flow, tracks answers/suggestions for all 4 hero sections, handles session lifecycle

### FE-008: Integrate Hero Story AI Panel with Form
- [ ] Modify hero story form component to render HeroStoryAIPanel
- [ ] Wire "Get AI Help" button to `openHeroAIPanel(storyId)` action
- [ ] Render `HeroStoryAIPanel` component in template with:
  - `:isOpen="heroAIPanel.isOpen"`
  - `:storyId="currentStoryId"`
  - `@accept="handleAcceptSuggestions"`
  - `@close="dismissHeroAIPanel"`
- [ ] Pass current form values to store when opening panel
- [ ] Handle "Accept" event:
  - Extract suggestions from `heroAIPanel.allStepSuggestions`
  - Map suggestions to form fields:
    - hurdle.suggestion1 → hurdleProblem
    - hurdle.suggestion2 → hurdleScope
    - hurdle.suggestion3 → hurdleStakes
    - expectation.suggestion1 → expectationRole
    - expectation.suggestion2 → expectationGoals
    - expectation.suggestion3 → expectationConstraints
    - response.suggestion1 → responseActions
    - response.suggestion2 → responseTools
    - response.suggestion3 → responseChallenges
    - outcome.suggestion1 → outcomeDeliverable
    - outcome.suggestion2 → outcomeMetrics
    - outcome.suggestion3 → outcomeImpact
  - Update form with AI suggestions
  - Call `acceptHeroAISuggestions()` to close panel
- [ ] Handle "Dismiss" event: call `dismissHeroAIPanel()` without modifying form
- [ ] Display success toast when suggestions accepted
- [ ] Show error toast if AI generation fails during any step

**Dependencies:** FE-001 through FE-007
**Success criteria:** Complete 4-step flow works: click help → Step 1 (Hurdle) → Step 2 (Expectation) → Step 3 (Response) → Step 4 (Outcome) → accept → form updates with all suggestions

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
