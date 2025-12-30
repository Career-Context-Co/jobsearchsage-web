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

### FE-001: XYZ Enhancement Types
- [ ] Create `shared/types/enhancement.ts` file
- [ ] Define `XYZQuestion` type (id: string, text: string)
- [ ] Define `QuestionGroup` type (category: string, questions: XYZQuestion[])
- [ ] Define `StoryNote` type (title?: string, text: string, type: 'project' | 'initiative' | 'responsibility' | 'achievement')
- [ ] Define `ContextObject` type (notes: StoryNote[], answeredQuestions: Array<{ id: string, answer: string }>)
- [ ] Define `BulletPair` type (primary: string, secondary: string)
- [ ] Update `shared/types/careerId.ts` to add:
  - [ ] `lastEnhancedAt?: string | null` to Experience type
  - [ ] `contextNotes?: string | null` to Experience type

**Dependencies:** None
**Testable by:** Frontend team (type checking)
**Success criteria:** All XYZ-specific types defined, no TypeScript errors, types match backend implementation

---

### FE-002: Store XYZ Enhancement Actions
- [ ] Update `app/stores/careerIDStore.ts` with XYZ enhancement state
- [ ] Add state: `enhancingExperienceId: number | null`, `enhancementRound: 1 | 2 | 3`, `enhancementContext`, `isGeneratingQuestions`, `isGeneratingBullets`, `enhancementError`, `generatedBullets`
- [ ] Add action: `generateInitialQuestions(experience)` - calls `/gather-context` endpoint (Round 1)
  - [ ] Returns `{ questionGroups: QuestionGroup[], notes: StoryNote[] }`
  - [ ] Stores notes in `enhancementContext.storyNotes`
- [ ] Add action: `generateFollowUpQuestions(experience, context)` - calls `/gather-context` endpoint (Round 2+)
  - [ ] Accepts context with answeredQuestions from previous round
  - [ ] Returns follow-up questions (if any) and updated notes
- [ ] Add action: `generateFinalBullets(experience, contextNotes)` - calls `/enhance-achievements` endpoint (Round 3)
  - [ ] Returns `{ bullets: BulletPair[] }` (3-5 primary/secondary pairs)
  - [ ] Stores in `generatedBullets` state
- [ ] Add action: `saveEnhancedBullets(experienceId, bullets, contextNotes)` - calls existing PATCH endpoint
  - [ ] Updates experience with selected bullets and contextNotes
  - [ ] Updates `lastEnhancedAt` timestamp
- [ ] Add action: `updateAnsweredQuestions(questions)` - updates context with latest answers
- [ ] Add action: `cancelEnhancement()` - clears all enhancement state
- [ ] Add error handling for all enhancement actions
- [ ] Add loading state management

**Dependencies:** FE-001, BE-002, BE-003
**Testable by:** Frontend team (test store actions with mock API, test multi-round flow)
**Success criteria:** Store actions work correctly, context tracking works across 3 rounds, bullets generated properly

---

## PHASE 3B: FRONTEND - ENHANCEMENT PANE (INTEGRATED INTO EXPERIENCE PAGE)

### Overview
Enhance profile experiences directly on `/profile/experience` page with a 50% slide-out pane triggered by `?enhance=<id>` query parameter. Three-round flow embedded in pane: Round 1 (initial questions) → Round 2 (follow-ups) → Round 3 (context review & save).

---

### FE-003: Modify experience.vue for Enhancement Pane Integration
- [ ] Add query parameter handling:
  - [ ] Read `enhance` query param using `useRoute()`
  - [ ] Display EnhancementPane conditionally when `route.query.enhance` exists
  - [ ] Highlight experience card matching `route.query.enhance` param
- [ ] Add "Enhance" button to experience card view mode (next to "Edit" button)
  - [ ] Clicking button sets `?enhance=<id>` query param
- [ ] Add "Enhance" button to experience card edit mode (as additional action)
  - [ ] Clicking button sets `?enhance=<id>` query param
- [ ] Implement pane open/close:
  - [ ] Open: Set query param `?enhance=<id>`
  - [ ] Close: Remove query param (via `useRouter()`)
  - [ ] Add close button (X) in pane header
- [ ] Add CSS for 50% width pane (or full-width on mobile)
- [ ] Add Tailwind transitions for smooth slide-in animation

**Dependencies:** FE-002
**Testable by:** Frontend team (query param management, visual display, button functionality)
**Success criteria:** Pane opens/closes with query param, card highlights, buttons trigger correctly

---

### FE-004: Create EnhancementPane.vue Component
- [ ] Build main pane container with left/right layout structure
- [ ] Implement step navigation logic (Round 1 → Round 2 → Round 3 → Save/Cancel)
- [ ] Add step indicator at top showing progress (e.g., "Step 1 of 3" or "Round X")
- [ ] Add pane header with title and close button (X)
- [ ] Conditionally render appropriate step component based on current round:
  - [ ] Round 1: `<EnhancementStep1 />`
  - [ ] Round 2: `<EnhancementStep2 />` (only if follow-up questions exist)
  - [ ] Round 3: `<EnhancementStep3 />`
- [ ] Implement round progression logic:
  - [ ] "Next" button advances to next round
  - [ ] "Back" button returns to previous round (disable on Round 1)
  - [ ] Auto-advance from Round 2 if no follow-up questions (jump to Round 3)
- [ ] Handle pane close on "Cancel" or after successful "Save"
- [ ] Pass relevant state to child components via props
- [ ] Emit state updates back to parent (experience.vue)

**Dependencies:** FE-003
**Testable by:** Frontend team (step navigation, conditional rendering)
**Success criteria:** Pane displays correct step, navigation works, rounds progress properly

---

### FE-005: Create EnhancementStep1.vue Component (Round 1: Initial Questions)
- [ ] Accept props: `questionGroups: QuestionGroup[]`, `isLoading: boolean`
- [ ] Display loading state while questions are being generated
- [ ] Display grouped questions organized by category:
  - [ ] Show category header (e.g., "General Role Context", "Key Achievements", etc.)
  - [ ] List 5-7 questions per group with textarea inputs
  - [ ] Add "Skip" checkbox option for each question (optional)
- [ ] Implement answer collection:
  - [ ] Store answers in component state: `answeredQuestions: Array<{ id, answer }>`
  - [ ] Validate: at least one question must be answered
  - [ ] Show validation error if user clicks "Next" with no answers
- [ ] Add button layout: "Next" (enabled when valid), "Cancel"
- [ ] Emit event when user clicks "Next": `@proceed:round1="answers"`
- [ ] Show helpful text explaining Round 1 purpose

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (question display, answer collection, validation)
**Success criteria:** Questions display grouped by category, answers collected, validation works

---

### FE-006: Create EnhancementStep2.vue Component (Round 2: Follow-up Questions)
- [ ] Accept props: `storyNotes: StoryNote[]`, `questionGroups: QuestionGroup[]`, `isLoading: boolean`
- [ ] Display accumulated story notes as read-only cards above questions:
  - [ ] Show notes from Round 1 (generated by AI from initial answers)
  - [ ] Format nicely with card styling
  - [ ] Include note type badge (project, initiative, responsibility, achievement)
- [ ] Display new follow-up questions (if any):
  - [ ] Same structure as Step 1 (grouped by category)
  - [ ] May have fewer questions than Round 1 (targeted follow-ups)
- [ ] Implement answer collection (same as Step 1):
  - [ ] Store answers, validate at least one question answered
- [ ] Add button layout: "Back", "Next" (enabled when valid), "Cancel"
- [ ] Emit events:
  - [ ] `@back="returnToRound1"` 
  - [ ] `@proceed:round2="answers"` when Next clicked
- [ ] Show round indicator (e.g., "Round 2: Follow-up Questions")

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (story notes display, question display, multi-round flow)
**Success criteria:** Story notes display, follow-up questions display, answers collected, Back/Next work

---

### FE-007: Create EnhancementStep3.vue Component (Round 3: Context Review & Save)
- [ ] Accept props: `storyNotes: StoryNote[]`, `bulletPairs: BulletPair[]`, `isLoading: boolean`
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
  - [ ] **Round 1:** Call `generateInitialQuestions(experience)`, display EnhancementStep1
  - [ ] **User Submits Round 1 Answers:** Store in `enhancementContext.answeredQuestions`
  - [ ] **Round 2:** Call `generateFollowUpQuestions(experience, context)`, display EnhancementStep2
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

**Dependencies:** FE-003, FE-004, FE-005, FE-006, FE-007, FE-002
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
| **Component Count** | 8 components (flow, form, preview, etc.) | 5 components (pane, step1, step2, step3, + modified experience.vue) | Simpler architecture |
