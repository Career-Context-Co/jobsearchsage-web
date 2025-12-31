# Implementation Tasks: Deep Profile Achievement Enhancement

## USER STORY CONTEXT

**Feature:** Deep Profile Achievement Enhancement  
**User Story:** As a user with a completed profile, I want to navigate to a dedicated enhancement page where I can deeply enhance my achievements by answering AI-generated questions about my work, so that I can transform vague descriptions into quantified, impressive achievement statements.

**Key Constraints:**
- Dedicated page at `/profile/enhance` (separate from onboarding)
- Conversational AI flow: generate questions → process answers → generate follow-ups OR enhanced achievements
- Store answers in component state for regeneration (not persisted to database)
- Add `last_enhanced_at` timestamp to track enhancement status
- Support both individual and bulk enhancement flows
- Coexists with light polish feature (separate use cases)

---

## PHASE 1: DATABASE

### DB-001: Add Enhancement Tracking & Context Columns
- [x] Design migration to add `last_enhanced_at` and `context_notes` columns to `career_id.experience` table
- [x] Create migration file: `deliverables/migrations/015_add_experience_enhancement_tracking.sql`
- [x] Add `last_enhanced_at` as nullable TIMESTAMPTZ (defaults to NULL for existing records)
- [x] Add `context_notes` as nullable TEXT (stores user's interview/achievement context)
- [x] Add column comments explaining purpose
- [x] Test migration on development database

**Dependencies:** None  
**Testable by:** Database team (verify columns added, check existing records unaffected)  
**Success criteria:** Columns added successfully, no data loss, existing queries still work

---

## PHASE 2: BACKEND

### BE-001: XYZ Method Enhancement Utility
- [x] Create `server/utils/profile-experience-enhancer.ts` utility module (consolidated implementation)
- [x] Implement `generateXYZQuestions()` function (uses Context Gathering Prompt, multi-round flow with questionGroups)
- [x] Implement `generateXYZBullets()` function (uses Bullet Writing Prompt, generates primary/secondary bullet pairs)
- [x] Add AI Gateway integration using GPT-4o model (upgraded from gpt-4o-mini)
- [x] System prompts embedded in utility with improved formatting
- [x] Add employment type handling (full-time, part-time, contract, internship)
- [x] Add error handling for AI provider errors
- [x] Add timeout handling (30s for questions, 20s for bullets)
- [x] Export `XYZEnhancementError` class for error handling

**Dependencies:** None
**Testable by:** Backend team (unit tests with mock AI responses, test all employment types)
**Success criteria:** Functions generate XYZ-format questions and bullets, handle employment types correctly

---

### BE-002: XYZ Question Generation Endpoint
- [x] Create `server/api/career-id/profile/[profileId]/experience/[id]/gather-context.post.ts` endpoint
- [x] Accept request body: `{ experience: Experience, context?: ContextObject }`
- [x] Validate required fields (experience with title, employer, employmentType; optional context)
- [x] Call `generateXYZQuestions()` from profile-experience-enhancer utility
- [x] Return response: `{ success: true, data: { questionGroups: [...], notes: [...] } }` (grouped questions)
- [x] Add comprehensive error handling (validation, timeout, AI errors)
- [x] Add request/response logging with metrics
- [x] Document endpoint in JSDoc comments

**Dependencies:** BE-001
**Testable by:** Backend team (test with different employment types, verify question quality)
**Success criteria:** Endpoint generates 5-7 XYZ-focused questions, tailored to employment type

---

### BE-003: XYZ Bullet Generation Endpoint
- [x] Create `server/api/career-id/profile/[profileId]/experience/[id]/enhance-achievements.post.ts` endpoint
- [x] Accept request body: `{ experience: Experience, notes: StoryNote[] }`
- [x] Validate required fields and notes format
- [x] Call `generateXYZBullets()` from profile-experience-enhancer utility
- [x] Return response: `{ success: true, data: { bullets: [{ primary, secondary }] } }` (structured pairs)
- [x] Add comprehensive error handling
- [x] Add request/response logging
- [x] Document endpoint in JSDoc comments

**Dependencies:** BE-001
**Testable by:** Backend team (test with various answer qualities, verify XYZ format)
**Success criteria:** Endpoint generates 3-5 XYZ-format bullets with metrics, appropriate verbs for employment type

---

## PHASE 3A: FRONTEND - TYPES & STORE

### FE-001: Context Enhancement Types
- [x] Create `shared/types/enhancement.ts` file
- [x] Define `ContextQuestion` type (id: string, text: string)
- [x] Define `QuestionGroup` type (category: string, questions: ContextQuestion[])
- [x] Define `ContextStory` type (title?: string, text: string, type: 'project' | 'initiative' | 'responsibility' | 'achievement')
- [x] Define `ContextObject` type (notes: ContextStory[], answeredQuestions: Array<{ id: string, answer: string }>)
- [x] Define `ResumeBullet` type (primary: string, secondary: string)
- [x] Update `shared/types/careerId.ts` to add:
  - [x] `lastEnhancedAt?: string | null` to Experience type
  - [x] `contextNotes?: string | null` to Experience type

**Dependencies:** None
**Testable by:** Frontend team (type checking)
**Success criteria:** All XYZ-specific types defined, no TypeScript errors, types match backend implementation

---

### FE-002: Store Context Enhancement Actions (API Layer Only)
- [x] Update `app/stores/careerIDStore.ts` with minimal API state
- [x] Add state: `isGeneratingQuestions: boolean`, `isGeneratingBullets: boolean` (loading indicators only)
- [x] Add action: `generateInitialQuestions(experience)` - calls `/gather-context` endpoint (Round 1)
  - [x] Returns `{ questionGroups: QuestionGroup[], notes: ContextStory[] }`
  - [x] Component stores results locally
- [x] Add action: `generateFollowUpQuestions(experience, context)` - calls `/gather-context` endpoint (Round 2+)
  - [x] Accepts context with answeredQuestions from previous rounds
  - [x] Returns follow-up questions (if any) and updated notes
  - [x] Component accumulates results locally
- [x] Add action: `generateFinalBullets(experience, notes)` - calls `/enhance-achievements` endpoint (Round 3)
  - [x] Accepts accumulated `notes: ContextStory[]` from component
  - [x] Returns `ResumeBullet[]` (3-5 primary/secondary pairs)
  - [x] Component stores bullets locally until save
- [x] Component calls existing `updateExperience()` to save bullets + contextNotes + lastEnhancedAt
- [x] Add error handling for all API actions
- [x] Add loading state management

**Note:** Component-specific state (rounds, context, bullets, errors) managed in EnhancementPane.vue, not in store

**Dependencies:** FE-001, BE-002, BE-003
**Testable by:** Frontend team (test store API actions return correct data)
**Success criteria:** Store provides clean API layer; component manages enhancement flow state locally

---

## PHASE 3B: FRONTEND - ENHANCEMENT PANE (INTEGRATED INTO EXPERIENCE PAGE)

### Overview
Enhance profile experiences directly on `/profile/experience` page with a 50% slide-out pane triggered by `?enhance=<id>` query parameter. Three-round flow embedded in pane: Round 1 (initial questions) → Round 2 (follow-ups) → Round 3 (context review & save).

---

### FE-003: Modify experience.vue for Enhancement Pane Integration
- [x] Add query parameter handling:
  - [x] Read `enhance` query param using `useRoute()`
  - [x] Display EnhancementPane conditionally when `route.query.enhance` exists
  - [x] Highlight experience card matching `route.query.enhance` param
- [x] Add "Enhance" button to experience card view mode (next to "Edit" button)
  - [x] Clicking button sets `?enhance=<id>` query param
- [x] Add "Enhance" button to experience card edit mode (as additional action)
  - [x] Clicking button sets `?enhance=<id>` query param
- [x] Implement pane open/close:
  - [x] Open: Set query param `?enhance=<id>`
  - [x] Close: Remove query param (via `useRouter()`)
  - [x] Add close button (X) in pane header
- [x] Add CSS for 50% width pane (or full-width on mobile)
- [x] Add Tailwind transitions for smooth slide-in animation

**Dependencies:** FE-002
**Testable by:** Frontend team (query param management, visual display, button functionality)
**Success criteria:** Pane opens/closes with query param, card highlights, buttons trigger correctly

---

### FE-004: Create EnhancementPane.vue Component
- [x] Build main pane container with left/right layout structure
- [x] Implement step navigation logic (Round 1 → Round 2 → Round 3 → Save/Cancel)
- [x] Add step indicator at top showing progress (e.g., "Step 1 of 3" or "Round X")
- [x] Add pane header with title and close button (X)
- [x] Conditionally render appropriate step component based on current round:
  - [x] Round 1: `<EnhancementQuestionRound :round="1" />`
  - [x] Round 2: `<EnhancementQuestionRound :round="2" :storyNotes="..." />` (only if follow-up questions exist)
  - [x] Round 3: `<EnhancementStep3 />`
- [x] Implement round progression logic:
  - [x] "Next" button advances to next round
  - [x] "Back" button returns to previous round (disable on Round 1)
  - [x] Auto-advance from Round 2 if no follow-up questions (jump to Round 3)
- [x] Handle pane close on "Cancel" or after successful "Save"
- [x] Pass relevant state to child components via props
- [x] Emit state updates back to parent (experience.vue)

**Dependencies:** FE-003
**Testable by:** Frontend team (step navigation, conditional rendering)
**Success criteria:** Pane displays correct step, navigation works, rounds progress properly

---

### FE-005: Create EnhancementQuestionRound.vue Component (Rounds 1 & 2: Question Collection)
- [ ] Accept props: `round: 1 | 2`, `questionGroups: QuestionGroup[]`, `storyNotes?: ContextStory[]`, `isLoading?: boolean`
- [ ] Display loading state while questions are being generated
- [ ] Conditionally display story notes (only for Round 2):
  - [ ] Show accumulated story notes as read-only cards above questions when `round === 2` and `storyNotes` exists
  - [ ] Format nicely with card styling
  - [ ] Include note type badge (project, initiative, responsibility, achievement)
- [ ] Display grouped questions organized by category:
  - [ ] Show category header (e.g., "General Role Context", "Key Achievements", etc.)
  - [ ] List questions per group with textarea inputs
  - [ ] Add "Skip" checkbox option for each question (optional)
- [ ] Implement answer collection:
  - [ ] Store answers in component state: `answeredQuestions: Array<{ id, answer }>`
  - [ ] Validate: at least one question must be answered
  - [ ] Show validation error if user clicks "Next" with no answers
- [ ] Add button layout with conditional rendering:
  - [ ] Round 1: "Next" (enabled when valid), "Cancel"
  - [ ] Round 2: "Back", "Next" (enabled when valid), "Cancel"
- [ ] Emit events:
  - [ ] `@proceed` with round number and answers when Next clicked
  - [ ] `@back` when Back clicked (only for Round 2)
  - [ ] `@cancel` when Cancel clicked
- [ ] Show helpful text explaining round purpose:
  - [ ] Round 1: "Initial questions to understand your achievements"
  - [ ] Round 2: "Follow-up questions based on your previous answers"

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (question display, answer collection, validation, conditional story notes display)
**Success criteria:** Questions display grouped by category, answers collected, validation works, story notes show for Round 2 only, Back button only for Round 2

---

### FE-007: Create EnhancementStep3.vue Component (Round 3: Context Review & Save)
- [ ] Accept props: `storyNotes: ContextStory[]`, `bulletPairs: ResumeBullet[]`, `isLoading: boolean`
- [ ] Display accumulated story notes (read-only cards):
  - [ ] Show all notes from Round 1 + Round 2
  - [ ] Format consistently with Step 2
- [ ] Add editable context notes textarea:
  - [ ] Label: "Additional Context (Optional)"
  - [ ] Placeholder: "Add any additional context about your achievements, metrics, or accomplishments..."
  - [ ] Store in component state for submission
- [ ] Display generated XYZ bullets preview:
  - [ ] Show 3-5 bullet pairs (primary/secondary)
  - [ ] Format: `• [Primary bullet]` with secondary underneath as read-only reference
  - [ ] Highlight X/Y/Z components or show inline badges
- [ ] Add button layout: "Back", "Save", "Cancel"
- [ ] Emit events:
  - [ ] `@back="returnToRound2"`
  - [ ] `@save="{ bullets, contextNotes }"` when Save clicked
  - [ ] `@cancel="close"`
- [ ] Handle save loading state (disable Save button during submission)

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (display of notes/bullets, context notes editing)
**Success criteria:** Story notes & bullets display, context notes editable, Save/Back/Cancel work

---

### FE-008: Implement Multi-Round Enhancement Flow Logic
- [ ] In experience.vue, orchestrate the 3-round flow:
  - [ ] **Initialization:** When `?enhance=<id>` is set, fetch experience and start Round 1
  - [ ] **Round 1:** Call `generateInitialQuestions(experience)`, display EnhancementQuestionRound with `round="1"`
  - [ ] **User Submits Round 1 Answers:** Store in `enhancementContext.answeredQuestions`
  - [ ] **Round 2:** Call `generateFollowUpQuestions(experience, context)`, display EnhancementQuestionRound with `round="2"` and `storyNotes`
  - [ ] **User Submits Round 2 Answers:** Append to `answeredQuestions`, update `storyNotes`
  - [ ] **Check for More Rounds:** If questionGroups empty, skip to Round 3; else repeat Round 2
  - [ ] **Round 3:** Display EnhancementStep3 with story notes and editable context textarea
  - [ ] **On Save:** Call `generateFinalBullets(experience, contextNotes)`, then wait for bullets
  - [ ] **Display Bullets:** Show XYZ bullets in Step 3, allow user to accept
- [ ] Implement error handling:
  - [ ] Catch API errors at each round
  - [ ] Show toast error notification
  - [ ] Allow user to retry without losing answers
- [ ] Implement cancel flow:
  - [ ] Clear all enhancement state on cancel
  - [ ] Remove `?enhance` query param
  - [ ] Close pane
- [ ] Implement save flow:
  - [ ] Call `saveEnhancedBullets(experienceId, selectedBullets, contextNotes)`
  - [ ] Update experience card with new bullets and `lastEnhancedAt` timestamp
  - [ ] Show success toast notification
  - [ ] Close pane and remove `?enhance` query param
  - [ ] Optionally highlight the saved experience card for review

**Dependencies:** FE-003, FE-004, FE-005, FE-007, FE-002
**Testable by:** Frontend team (end-to-end flow testing, error scenarios)
**Success criteria:** Full 3-round flow works, errors handled gracefully, bullets saved correctly

---

### FE-009: Update Profile Dashboard Enhancement Status (Optional)
- [ ] Update `app/pages/profile/index.vue` experience cards
- [ ] Add enhancement status badge to each experience:
  - [ ] "Enhanced" badge if `lastEnhancedAt` exists (show date: "Enhanced on Jan 15")
  - [ ] "Not Enhanced" subtle text if `lastEnhancedAt` is null
- [ ] Add "Deep Enhance" link/button to experience card (next to existing actions)
- [ ] Clicking "Deep Enhance" sets `?enhance=<id>` param on `/profile/experience` page
- [ ] Optional: Add small indicator icon showing enhancement status

**Dependencies:** FE-008
**Testable by:** Frontend team (badge display, navigation)
**Success criteria:** Enhancement status displays, Deep Enhance button navigates to experience page


## KEY ARCHITECTURAL CHANGES (from previous plan)

| Change | Previous | New | Reason |
|--------|----------|-----|--------|
| **Page Location** | Dedicated `/profile/enhance` page | Integrated into `/profile/experience` page with query param | Better context visibility, simpler UX |
| **Flow Triggering** | Separate page navigation | `?enhance=<id>` query parameter | Keeps user in context |
| **Pane Style** | Modal dialog | 50% slide-out pane from right | Better for showing experience list + pane together |
| **Context Persistence** | Stored in component state only | Added `context_notes` column to database | Enables future regenerations |
| **Bulk Enhancement** | Separate "Enhance All" feature | Removed (individual flow per experience) | Reduces complexity, each experience needs iterative input |
| **Preview/Accept** | Final step in modal | Integrated into Step 3 with context review | More natural flow with context visible |
| **Component Count** | 8 components (flow, form, preview, etc.) | 4 components (pane, questionRound, step3, + modified experience.vue) | Simpler architecture, combined question rounds |
