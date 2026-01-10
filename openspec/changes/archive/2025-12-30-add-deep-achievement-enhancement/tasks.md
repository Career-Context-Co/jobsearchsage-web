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
Enhance profile experiences directly on `/profile/experience` page with a 50% slide-out pane triggered by `?enhance=<id>` query parameter. Four-round flow embedded in pane: Round 1 (initial questions) → Round 2 (follow-ups) → Round 3 (context review) → Round 4 (bullet selection & save).

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
- [x] Accept props: `round: 1 | 2`, `questionGroups: QuestionGroup[]`, `storyNotes?: ContextStory[]`, `isLoading?: boolean`
- [x] Display loading state while questions are being generated
- [x] Conditionally display story notes (only for Round 2):
  - [x] Show accumulated story notes as read-only cards above questions when `round === 2` and `storyNotes` exists
  - [x] Format nicely with card styling
  - [x] Include note type badge (project, initiative, responsibility, achievement)
- [x] Display grouped questions organized by category:
  - [x] Show category header (e.g., "General Role Context", "Key Achievements", etc.)
  - [x] List questions per group with textarea inputs
  - [x] Add "Skip" checkbox option for each question (optional)
- [x] Implement answer collection:
  - [x] Store answers in component state: `answeredQuestions: Array<{ id, answer }>`
  - [x] Validate: at least one question must be answered
  - [x] Show validation error if user clicks "Next" with no answers
- [x] Add button layout with conditional rendering:
  - [x] Round 1: "Next" (enabled when valid), "Cancel"
  - [x] Round 2: "Back", "Next" (enabled when valid), "Cancel"
- [x] Emit events:
  - [x] `@proceed` with round number and answers when Next clicked
  - [x] `@back` when Back clicked (only for Round 2)
  - [x] `@cancel` when Cancel clicked
- [x] Show helpful text explaining round purpose:
  - [x] Round 1: "Initial questions to understand your achievements"
  - [x] Round 2: "Follow-up questions based on your previous answers"

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (question display, answer collection, validation, conditional story notes display)
**Success criteria:** Questions display grouped by category, answers collected, validation works, story notes show for Round 2 only, Back button only for Round 2

---

### FE-007: Create EnhancementContextReview.vue Component (Round 3: Context Review & Edit)
- [x] Accept props: `storyNotes: ContextStory[]`, `isLoading: boolean`
- [x] Display accumulated story notes (read-only cards):
  - [x] Show all notes from Round 1 + Round 2
  - [x] Format consistently with EnhancementQuestionRound.vue (Step 2)
- [x] Add editable context notes textarea:
  - [x] Label: "Additional Context (Optional)"
  - [x] Placeholder: "Add any additional context about your achievements, metrics, or accomplishments..."
  - [x] Store in component state for submission
- [x] Add button layout: "Back", "Next: Review Bullets", "Cancel"
- [x] Emit events:
  - [x] `@back` when Back clicked
  - [x] `@proceed` with contextNotes when Next clicked
  - [x] `@cancel` when Cancel clicked
- [x] Import EnhancementContextReview in EnhancementPane.vue
- [x] Pass props correctly: story notes and loading state

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (display of notes/bullets, context notes editing)
**Success criteria:** Story notes & bullets display, context notes editable, Save/Back/Cancel work

---

### FE-008: Create EnhancementBulletReview.vue Component (Round 4: Bullet Selection & Save)
- [x] Accept props: `storyNotes: ContextStory[]`, `bulletPairs: ResumeBullet[]`, `isLoading: boolean`
- [x] Display accumulated story notes (read-only, same format as Step 3):
  - [x] Show all notes from Rounds 1 & 2
  - [x] Format consistently with previous rounds
- [x] Display generated XYZ bullets as selectable options:
  - [x] Show 3-5 bullet pairs
  - [x] Each bullet displays BOTH primary AND secondary as equal options
  - [x] Radio button or toggle UI to select preferred option for each bullet
  - [x] Visual indicator showing which option is currently selected
  - [x] Format: `• [Option A]` with `• [Option B]` underneath or side-by-side
- [x] Add selection state tracking:
  - [x] Initialize with primary selected by default
  - [x] Allow user to switch selections
  - [x] Store selected option for each bullet
- [x] Add button layout: "Back", "Save", "Cancel"
- [x] Emit events:
  - [x] `@back` when Back clicked
  - [x] `@save="{ selectedBullets }"` with array of selected bullet texts when Save clicked
  - [x] `@cancel` when Cancel clicked
- [x] Handle save loading state (disable Save button during submission)
- [x] Show visual feedback when option is selected

**Dependencies:** FE-001, FE-004
**Testable by:** Frontend team (bullet display, selection interaction, emission)
**Success criteria:** Bullets display with both options, user can select preferences, selections persist and emit correctly

---

### FE-009: Implement Multi-Round Enhancement Flow Logic
- [x] In EnhancementPane.vue, orchestrate the 4-round flow:
  - [x] **Initialization:** When `?enhance=<id>` is set, fetch experience and start Round 1
  - [x] **Round 1:** Call `generateInitialQuestions(experience)`, display EnhancementQuestionRound with `round="1"`
  - [x] **User Submits Round 1 Answers:** Store in `enhancementContext.answeredQuestions`
  - [x] **Round 2:** Call `generateFollowUpQuestions(experience, context)`, display EnhancementQuestionRound with `round="2"` and `storyNotes`
  - [x] **User Submits Round 2 Answers:** Append to `answeredQuestions`, update `storyNotes`
  - [x] **Check for More Rounds:** If questionGroups empty, skip to Round 3; else repeat Round 2
  - [x] **Round 3:** Display EnhancementContextReview with story notes and editable context textarea
  - [x] **User Reviews Context:** Call `generateFinalBullets(experience, accumulatedContext)` when Next clicked
  - [x] **Round 4:** Display EnhancementBulletReview with bullet pairs and selection UI
  - [x] **User Selects Bullets:** Store selected bullets in component state
  - [x] **On Save:** Call existing `updateExperience()` with selected bullets and context notes
- [x] Implement error handling:
  - [x] Catch API errors at each round
  - [x] Show toast error notification (TODO: implement toast in components)
  - [x] Allow user to retry without losing answers
- [x] Implement cancel flow:
  - [x] Clear all enhancement state on cancel
  - [x] Remove `?enhance` query param (parent handles this)
  - [x] Close pane
- [x] Implement save flow:
  - [x] Call `updateExperience(experienceId, { highlights: selectedBullets, contextNotes, lastEnhancedAt })`
  - [x] Update experience card with new bullets and `lastEnhancedAt` timestamp
  - [x] Show success toast notification (TODO: implement toast)
  - [x] Close pane and remove `?enhance` query param
  - [x] Optionally highlight the saved experience card for review (parent handles this)

**Dependencies:** FE-003, FE-004, FE-005, FE-007, FE-008, FE-002
**Testable by:** Frontend team (end-to-end flow testing, error scenarios)
**Success criteria:** Full 4-round flow works, errors handled gracefully, selected bullets saved correctly

---

### FE-009: Update Profile Dashboard Enhancement Status (Optional)
- [x] Add enhancement status badge to experience cards on `/profile/experience` page
  - [x] Display "Enhanced on [date]" badge if `lastEnhancedAt` exists (green success color)
  - [x] Display "Not enhanced yet" text if `lastEnhancedAt` is null (muted/italic)
  - [x] Add to both view mode and edit mode card headers
- [x] Badge includes sparkles icon for visual identification
- [x] Enhancement status now visible alongside experience details

**Implementation Details:**
- Added to view mode: Below the date/location/employment type info
- Added to edit mode: In the header next to "Edit Work Experience" title
- Uses semantic `success` color for enhanced experiences
- Integrates with existing `formatDate()` utility

**Dependencies:** FE-008
**Testable by:** Frontend team (badge display on experience cards)
**Success criteria:** Enhancement status displays on all experience cards, "Enhance" button still navigates to enhancement flow


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
